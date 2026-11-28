import json, math, sys
def load(f): return {e['id']: e for e in json.load(open(f))}
def wlen(e):
    g=e['geometry']; return sum(math.hypot((g[k]['lat']-g[k-1]['lat'])*111320,(g[k]['lon']-g[k-1]['lon'])*111320*math.cos(math.radians(g[k]['lat']))) for k in range(1,len(g)))
def at(e, f):
    g=e['geometry']; L=wlen(e); d=f*L; s=0
    for k in range(1,len(g)):
        a,b=g[k-1],g[k]; l=math.hypot((b['lat']-a['lat'])*111320,(b['lon']-a['lon'])*111320*math.cos(math.radians(b['lat'])))
        if s+l>=d: t=(d-s)/l if l else 0; return (a['lat']+(b['lat']-a['lat'])*t, a['lon']+(b['lon']-a['lon'])*t)
        s+=l
    return (g[-1]['lat'],g[-1]['lon'])
W=load('/tmp/r49/nring.json'); S=load('/tmp/r49/spa.json'); I=load('/tmp/r49/inje.json')
NORD=[1009142894,1009142895,799394496,799394497,41395681,41395684,799394498,799394499,799394500,799394501,799394502,799394503,799394504,799394505,799394506,799394507,683061813,683061814,41395647,683006908,245166664,696037706,799394508,799394509,683061804,799394510,799394511,799394512,799394513,414785755,414785756,799394515,799394514,799394516,799394517,799394518,799394519,799394520,799394521,799394522,799394523,799394524,41395652,683303211,683303210,683303209,683303208,41792406,1571450724,799394494,799394495,41395668,41395670,41395673]
GP=[1149161210,1149161208,1443047846,1443047847,1079809244,820679447,820679448,820679446,1113009623,820679445,820330155,820330154,1113009624,820330153,820330152,1079809245,1443047845,1443047844,27852990,820679450]
GP24=[1149161210,31010602,1443047846,1443047847,1079809244,820679447,820679448,820679446,1113009623,820679445,820330155,820330154,1113009624,820330153,820330152,1079809245,1443047845,1443047844,27852990,820679450]
SPA=[175178443,175178448,126807110,126835639,126835637,126835638,1430527230,24449918,126807113,175195997,126807111,126807112,1359025268,126807106,1359025267,126807103,126807101,126807109,126807116,175371353,175371365,126807100,176133746,126807114,176133745,178964809,126807105,637268672,613486590,126807099]
def tot(D, ids): return sum(wlen(D[i]) for i in ids)
print('nord', round(tot(W,NORD)), 'gp', round(tot(W,GP)), 'spa', round(tot(S,SPA)))
def wps(D, ids, minlen=150, force=(), dense=False):
    out=[]
    for i in ids:
        e=D[i]; L=wlen(e)
        if L<minlen and i not in force: continue
        if dense and L>500: out+=[at(e,0.2), at(e,0.5), at(e,0.8)]
        elif dense and L>150: out+=[at(e,0.3), at(e,0.7)]
        elif L>900: out+= [at(e,0.3), at(e,0.7)]
        else: out.append(at(e,0.5))
    return out
fmt=lambda P: ';'.join(f'{a:.6f},{b:.6f}' for a,b in P)
nord=wps(W,NORD,250); gp=wps(W,GP,40,dense=True); spa=wps(S,SPA,100,force=(126807106,637268672)); inje=[at(I[651693293],f/12) for f in range(12)]
gp24=wps(W,GP24,40,force=(31010602,),dense=True)+wps(W,NORD,640)
for n,P in [('nordschleife',nord),('gp',gp),('spa',spa),('inje',inje),('n24h',gp24)]: print(n,len(P)); open(f'/tmp/r49/wp_{n}.txt','w').write(fmt(P))
