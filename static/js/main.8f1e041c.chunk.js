(this.webpackJsonpalongthesameline=this.webpackJsonpalongthesameline||[]).push([[0],{119:function(e,t,n){e.exports=n(129)},124:function(e,t,n){},125:function(e,t,n){},129:function(e,t,n){"use strict";n.r(t);var r=n(57),a=n.n(r),o=n(99),i=n.n(o),c=(n(124),n(104)),u=n(100),l=n(105),s=n(106),g=(n(125),n(126),n(103)),m=n(91),h=n(98),p=n(90),w=n(96),f=n(97),d=n(16),M=n(89),S=n(133),y=n(132),v=n(92),C=n(51),b=n(44),x=n(52),G=n(63),j=n(102),k=n(83),O=n(101),E=n(60),P=n(3),z=n(0),F=(new M.a).getStyle()()[0],I=function(e,t){return e.get("label")&&F.setText(new j.a({stroke:F.getStroke(),fill:F.getFill(),text:Math.round(e.get("label")/1e3)+" km",rotation:e.get("rotation"),rotateWithView:!0,offsetX:25})),F},V=function(e){var t=e[0][0]-e[1][0],n=e[0][1]-e[1][1];return Math.atan2(n,t)},A=function(e){var t=e.getGeometry().getCoordinates(),n=V([t[t.length-1],t[t.length-2]]);return[F,new G.c({geometry:new b.a(t[t.length-1]),image:new k.a({stroke:F.getStroke(),points:3,radius:8,rotation:-n,angle:Math.PI/2})}),new G.c({geometry:new b.a(t[0]),image:F.getImage()})]},W=function(e){Object(s.a)(n,e);var t=Object(l.a)(n);function n(e){var r;return Object(u.a)(this,n),(r=t.call(this,e)).fitGreatCircle=function(e,t){return new O.GreatCircle({x:e[0][0],y:e[0][1]},{x:e[1][0],y:e[1][1]}).Arc(t,{offset:.1}).geometries},r.generateGreatCircle=function(){var e=r.map.getView().calculateExtent(),t=Object(z.E)(e)/r.map.getSize()[0],n=r.pointSource.getFeatures()[0].getGeometry().getCoordinates().map((function(e){return Object(P.l)(e,"EPSG:4326")})),a=n.map((function(e){var t=Object(c.a)(e,2),n=t[0],r=t[1];return[n-180*Math.sign(n),-r]})),o=[n,[n[1],a[0]],a,[a[1],n[0]]],i=o.map((function(e){return Math.sqrt(Math.pow(e[0][0]-e[1][0],2)+Math.pow(e[0][1]-e[1][1],2))/t})).map((function(e){return Math.min(1e3,Math.max(1,Math.ceil(e/20)))})),u=o.map((function(e,t){return r.fitGreatCircle(e,i[t]).map((function(e){return new C.a({geometry:new x.a(e.coords.map((function(e){return Object(P.d)(e,"EPSG:4326")})))})}))})).flat(),l=t*r.map.getView().getProjection().getMetersPerUnit(),s=Math.ceil(Math.log10(10*l));s=Math.pow(10,s);var g=Object(E.a)(o[1][1],o[1][0]),m=Math.ceil(g/s),h=r.fitGreatCircle(o[1],m).map((function(e){return e.coords.map((function(t,n){var r=e.coords[Math.max(0,n-1)],a=e.coords[Math.min(n+1,e.length-1)],o=-V([r,a]),i=new x.a([[t[0]-.3*Math.sin(o),t[1]-.3*Math.cos(o)],[t[0]+.3*Math.sin(o),t[1]+.3*Math.cos(o)]]);return new C.a({geometry:i,label:s*n,rotation:o+Math.PI/2})}))})).flat();r.greatCircleSource.clear(),u[0].setStyle(A),r.greatCircleSource.addFeatures(u),r.greatCircleSource.addFeatures(h)},r.componentDidMount=function(){var e=new h.a({source:r.pointSource,type:"LineString",maxPoints:2});e.on("drawstart",(function(){r.pointSource.clear(),r.greatCircleSource.clear()}));var t=new m.a({center:[0,0],zoom:3,projection:"EPSG:4326"});t.on("change:resolution",r.generateGreatCircle),r.pointSource.on(["addfeature","changefeature"],r.generateGreatCircle),r.map=new g.a({layers:[new S.a({source:new y.a({url:"https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=Dy8GRe9OwAAQHfnhr24y",attributions:'<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',tileSize:256,maxZoom:20,crossOrigin:"anonymous"})}),new M.a({source:r.greatCircleSource,style:I}),new M.a({source:r.pointSource,style:[]})],target:"map",view:t,interactions:Object(p.a)().extend([new w.a({source:r.pointSource,insertVertexCondition:d.g}),e,new f.a({source:r.pointSource})])})},r.render=function(){return a.a.createElement("div",{id:"map"})},r.pointSource=new v.a,r.greatCircleSource=new v.a,r}return n}(a.a.Component);Boolean("localhost"===window.location.hostname||"[::1]"===window.location.hostname||window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/));i.a.render(a.a.createElement(a.a.StrictMode,null,a.a.createElement(W,null)),document.getElementById("root")),"serviceWorker"in navigator&&navigator.serviceWorker.ready.then((function(e){e.unregister()})).catch((function(e){console.error(e.message)}))}},[[119,1,2]]]);
//# sourceMappingURL=main.8f1e041c.chunk.js.map