# 盐城 2D：把 OSM / NaturalEarth / 示意岸线 投影成 SVG 世界坐标 path，输出 public/map.json
import json, math, numpy as np, shapefile
from shapely.geometry import shape, LineString, Polygon, MultiPolygon, box, Point, mapping
from shapely.ops import unary_union, linemerge
D='/workspace/yancheng-coast/data/'
LON0,LAT0,K=120.2,33.4,480.0
KX=K*math.cos(math.radians(LAT0))
def P(lon,lat): return ((lon-LON0)*KX,(LAT0-lat)*K)
def ring_d(coords,close):
    pts=[P(*c[:2]) for c in coords]
    s='M'+'L'.join(f'{x:.1f},{y:.1f}' for x,y in pts)
    return s+('Z' if close else '')
def geom_d(g):
    if g.is_empty: return ''
    t=g.geom_type
    if t=='Polygon': return ring_d(g.exterior.coords,1)+''.join(ring_d(i.coords,1) for i in g.interiors)
    if t in('MultiPolygon','GeometryCollection','MultiLineString'): return ''.join(geom_d(x) for x in g.geoms)
    if t=='LineString': return ring_d(g.coords,0)
    return ''
WIDE=box(108,26,128,40)
# --- land: NE10 China (wide) + OSM land mask (detailed, Yancheng) ---
ne=json.load(open(D+'ne10_countries.geojson'))
chn=unary_union([shape(f['geometry']) for f in ne['features'] if f['properties']['ADM0_A3'] in('CHN',)]).intersection(WIDE)
lm=shape(json.load(open(D+'land_mask.geojson'))['features'][0]['geometry'])
DET=box(119.4,32.5,121.4,34.45)
land=unary_union([chn.difference(DET), lm.intersection(DET)]).buffer(0.004).buffer(-0.004)
land=land.simplify(0.0015)
# --- provinces ---
r=shapefile.Reader('/tmp/adm1/ne_10m_admin_1_states_provinces.shp',encoding='utf-8')
fl=[x[0] for x in r.fields[1:]]
prov={}
for sr in r.iterShapeRecords():
    d=dict(zip(fl,sr.record))
    if d['adm0_a3']=='CHN' and d['name_zh'] in('江苏省','山东省','安徽省','河南省','浙江省','上海市'):
        prov[d['name_zh']]=shape(sr.shape.__geo_interface__)
js=prov['江苏省'].intersection(land.buffer(0.02)).simplify(0.003)
provlines=unary_union([p.boundary for p in prov.values()]).intersection(land.buffer(-0.01)).simplify(0.003)
# --- Yancheng admin ---
adm=json.load(open(D+'osm_admin.geojson'))['features']
yc=[shape(f['geometry']) for f in adm if f['properties'].get('admin_level')=='5'][0]
ycl=yc.intersection(land).buffer(0.002).buffer(-0.002).simplify(0.0012)
YCN=['响水县','滨海县','阜宁县','射阳县','建湖县','亭湖区','盐都区','大丰区','东台市']
cty={f['properties']['name']:shape(f['geometry']).intersection(ycl) for f in adm if f['properties'].get('name') in YCN}
ctylines=unary_union([g.boundary for g in cty.values()]).intersection(ycl.buffer(-0.01)).simplify(0.001)
ctylab={n:P(*g.representative_point().coords[0]) for n,g in cty.items()}
# --- today's coast (OSM, within Yancheng extent) ---
co=linemerge(unary_union([shape(f['geometry']) for f in json.load(open(D+'osm_coastline.geojson'))['features']]))
coast=co.intersection(box(119.4,32.55,121.4,34.6)).simplify(0.0012)
# --- rivers ---
ww=json.load(open(D+'osm_waterways.geojson'))['features']
MAJ=['串场河','射阳河','新洋港','斗龙港','黄沙港','通榆河','通榆运河','苏北灌溉总渠','废黄河','灌河','王港','川东港','西潮河','新通扬运河','蟒蛇河']
maj=[];net=[]
for f in ww:
    g=shape(f['geometry']); n=f['properties'].get('name')
    if g.geom_type not in('LineString','MultiLineString'): continue
    if not g.intersects(ycl.buffer(0.05)): continue
    if n in MAJ: maj.append(g.simplify(0.0008))
    else: net.append(g.simplify(0.0012))
majg=unary_union(maj).intersection(land); netg=unary_union(net).intersection(ycl.buffer(0.01))
# fan dike: 串场河 actual
cch=linemerge(unary_union([shape(f['geometry']) for f in ww if f['properties'].get('name')=='串场河']))
cchs=sorted(getattr(cch,'geoms',[cch]),key=lambda g:-g.length)
print('串场河 parts',[round(g.length,3) for g in cchs][:6])
# build dike polyline: north schematic (阜宁庙湾) -> 串场河 main (N->S) -> south to 东台/海安 schematic
main=cchs[0]
c=list(main.coords)
if c[0][1]<c[-1][1]: c=c[::-1]
dike=[(119.80,33.76),(119.93,33.63)]+[(x,y) for x,y in LineString(c).simplify(0.002).coords]+[(120.33,32.80),(120.40,32.62)]
# --- water areas (larger lakes) ---
wa=json.load(open(D+'osm_water_areas.geojson'))['features']
lakes=[]
for f in wa:
    g=shape(f['geometry'])
    if g.area>0.0004 and g.intersects(ycl): lakes.append(g.simplify(0.001))
lakeg=unary_union(lakes).intersection(ycl) if lakes else Polygon()
# --- Yellow River 1128-1855 course: chain 黄河故道/废黄河 W->E ---
hh=json.load(open(D+'hh_jiangsu.json'))
segs=[LineString(f['c']) for f in hh if f['name'] in('黄河故道','废黄河') and f['ww']=='river']
m=linemerge(unary_union(segs))
parts=sorted(getattr(m,'geoms',[m]),key=lambda g:g.coords[0][0])
pts=[]
for g in parts:
    cc=list(g.coords)
    if cc[0][0]>cc[-1][0]: cc=cc[::-1]
    pts+=cc
pts=sorted(pts,key=lambda p:p[0])
# extend upstream schematically to the frame's west edge (开封方向) and downstream to the 1855 mouth near 大淤尖
hhline=LineString([(114.6,34.80),(115.6,34.62),(116.3,34.50)]+pts+[(120.0,34.24),(120.27,34.27),(120.45,34.30)]).simplify(0.004)
# --- rings & sea overlays ---
def coastx(y):
    rr=LineString([(119.0,y),(122.0,y)]).intersection(co)
    xs=[p.x for p in getattr(rr,'geoms',[rr]) if p.geom_type=='Point']
    return min(xs) if xs else np.nan
rf=json.load(open(D+'coast_rings_schematic.geojson'))['features']
ext_s=[(32.75,120.36),(32.62,120.42),(32.48,120.48)]
rings=[];seas=[]
for f in rf:
    k=f['properties']['k']; cc=f['geometry']['coordinates']   # S->N
    south=[]
    for lat,fx in ext_s:
        cx=coastx(lat)
        if np.isnan(cx): cx=121.3
        south.append((fx+k*(cx-fx),lat))
    north_end=cc[-1]
    line=south[::-1]+[tuple(p) for p in cc]+[(north_end[0]+0.02,34.38),(north_end[0]+0.10,34.52)]
    L=LineString(line)
    poly=Polygon(line+[(123.5,34.52),(123.5,32.48)])
    sea=poly.intersection(land).intersection(ycl.buffer(0.03).union(box(120.3,32.4,121.5,32.9))).buffer(0.002).simplify(0.002)
    rings.append(ring_d(L.intersection(land.buffer(0.01)).coords if L.intersection(land.buffer(0.01)).geom_type=='LineString' else line,0))
    seas.append(geom_d(sea))
hist=json.load(open(D+'hist_coastlines_schematic.geojson'))['features']
xigang=ring_d(hist[0]['geometry']['coordinates'],0)
# --- places ---
PL={'盐城':(120.1577,33.3496),'白驹':(120.3085,33.0749),'大淤尖':(120.2669,34.2404),'丹顶鹤保护区':(120.5048,33.6084),
    '麋鹿保护区':(120.83,33.00),'条子泥':(120.95,32.80),'徐州':(117.181,34.2665),'淮安':(119.0197,33.5978),'开封':(114.35,34.79),
    '连云港':(119.2172,34.5933),'南通':(120.8905,31.9828),'泰州':(119.9181,32.458),'扬州':(119.4078,32.3969),'南京':(118.7969,32.0603),'上海':(121.47,31.23),
    '东台':(120.3154,32.8706),'大丰':(120.4962,33.202),'射阳':(120.3219,33.768),'阜宁':(119.7969,33.7603),'滨海':(119.8157,33.9915),'响水':(119.573,34.2013),'建湖':(119.7843,33.4402),
    '云梯关':(119.70,34.03),'上冈':(120.0181,33.5408),'草堰':(120.3194,32.9514)}
places={k:P(*v) for k,v in PL.items()}
# ruler at Yancheng latitude: dike x -> coast x
yl=33.35; dx=np.interp(-yl,[-p[1] for p in dike],[p[0] for p in dike]); cx=coastx(yl)
km=(cx-dx)*111.32*math.cos(math.radians(yl)); print('ruler km',round(km,1))
out=dict(land=geom_d(land),js=geom_d(js),prov=geom_d(provlines),yc=geom_d(ycl),cty=geom_d(ctylines),ctylab=ctylab,
    coast=geom_d(coast),maj=geom_d(majg),net=geom_d(netg),lakes=geom_d(lakeg),dike=ring_d(dike,0),hh=ring_d(hhline.coords,0),
    rings=rings,seas=seas,xigang=xigang,places=places,ruler=[P(dx,yl),P(cx,yl)],rulerKm=round(km,1),
    ycBox=[*P(ycl.bounds[0],ycl.bounds[3]),*P(ycl.bounds[2],ycl.bounds[1])])
json.dump(out,open('public/map.json','w'),ensure_ascii=False)
for k,v in out.items(): print(k, len(v) if isinstance(v,(str,list)) else v)
