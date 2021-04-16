import React from 'react';
import './App.css';
import 'ol/ol.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';

import {defaults as defaultInteractions, DragRotateAndZoom, Draw, Modify, Snap} from 'ol/interaction';
import {never} from 'ol/events/condition';

import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource, XYZ} from 'ol/source';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import {Fill, Stroke, Circle, Style} from 'ol/style';
import Text from 'ol/style/Text';
import RegularShape from 'ol/style/RegularShape';
import {rotate} from 'ol/coordinate';

import {GreatCircle} from 'arc';
import {getDistance} from 'ol/sphere';
import {get as getProjection, fromLonLat, toLonLat, transform} from 'ol/proj.js';
import {containsExtent, getHeight, getWidth} from 'ol/extent';
import {register} from 'ol/proj/proj4';
import proj4 from 'proj4';

const viewProjection = 'EPSG:3857';

const basicStyle = new Style({
  stroke: new Stroke({
    width: 1.5,
    color: '#0000cc'
  })
});

const textStyle = new Text({
  placement: 'line',
  stroke: basicStyle.getStroke(),
  font: '12px sans-serif',
  text: 'dummy',
  rotateWithView: true,
//  offsetX: 25,
});

const circleStyle = basicStyle.clone();
circleStyle.setText(textStyle);

const oneDegreeDistance = getDistance([0, 0], [0, 1]);

const projectionCache = {};
const getStereographicProjection = (center) => {
  center = center || [0, 0];
  const projName = 'StandardProj' + center[0] + '/' + center[1];
  if (!projectionCache[projName]) {
    proj4.defs(projName, '+proj=stere +lat_0=' + center[1] + ' +lon_0=' + center[0] + ' +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
    register(proj4);
    projectionCache[projName] = getProjection(projName);
  }
  return(projectionCache[projName]);
}

const distanceString = (distance) => {
  const dim = Math.floor(Math.log10(distance)) - 1;
//  const num = Math.round(distance / Math.pow(10, dim));
  if (dim < 3) {
    return Math.round(distance) + 'm';
  } else if (dim < 6) {
    return Math.round(distance / 1000) + 'km';
  } else if (dim < 9) {
    return Math.round(distance / 1000000) + 'k km';
  } else {
    return Math.round(distance / 1000000) + 'mio km';
  }
}

const circleStyleFunction = (feature, resolution) => {
  if (feature.get('label')) {
    circleStyle.getText().setText(feature.get('label'));
    circleStyle.getText().setRotation(feature.get('rotation'));
  }
  return circleStyle;
}

const getRotation = (points) => {
  const dx = points[0][0] - points[1][0];
  const dy = points[0][1] - points[1][1];
  return Math.atan2(dy, dx);
}

const arrowStyle = (feature) => {
  const geom = feature.getGeometry().getCoordinates();
  const rotation = getRotation([geom[geom.length - 1], geom[geom.length - 2]]);
  const radius = 6;
  const offset = radius + basicStyle.getStroke().getWidth();
  return [
    basicStyle,
    new Style({
      geometry: new Point(geom[geom.length - 1]),
      image: new RegularShape({
        stroke: circleStyle.getStroke(),
        points: 3,
        radius: radius,
        rotation: -rotation,
        rotateWithView: true,
        displacement: [ -offset * Math.abs(Math.cos(rotation)), 0 ],
        angle: Math.PI / 2
      })
    }),
    new Style({
      geometry: new Point(geom[0]),
      image: new RegularShape({
        stroke: circleStyle.getStroke(),
        points: 4,
        radius1: radius / 2,
        radius2: 0,
        rotation: -rotation,
        rotateWithView: true,
        angle: Math.PI / 4
      })
    })
  ];
}

class App extends React.Component {

  constructor(props) {
    super(props);

    this.pointSource = new VectorSource();
    this.greatCircleSource = new VectorSource();
  }

  fitGreatCircle = (points, numSegments) => {
    // TODO catch TypeError/Error when two points are antipodal
    const generator = new GreatCircle({ x: points[0][0], y: points[0][1] }, { x: points[1][0], y: points[1][1] });
    return generator.Arc(numSegments, { offset: 0.1 }).geometries; // 1 or more arc segments (split at +-180deg)
  }

  generateLineOfSight = (points) => {
    const antipodes = points.map(([x, y]) => [x - 180*Math.sign(x), -y]);
    const pointGroups = [
      points,
      [ points[1], antipodes[0] ],
      antipodes,
      [ antipodes[1], points[0] ],
    ];
    // TODO skip segments which aren't visible in the current view

    // in projection coordinates (because number of segments will depend on pixels)
    const extent = this.map.getView().calculateExtent();
    const unitsPerPixel = getWidth(extent) / this.map.getSize()[0];

    const pixelDistances = pointGroups.map((pair) => {
      const viewCoords = pair.map((point) => fromLonLat(point, this.map.getView().getProjection()));
      return Math.sqrt(Math.pow(viewCoords[0][0] - viewCoords[1][0], 2)
        + Math.pow(viewCoords[0][1] - viewCoords[1][1], 2)) / unitsPerPixel
    });
    // don't leave the 2, 1000 segment range
    const nSegments = pixelDistances.map((d) => Math.min(1000, Math.max(2, Math.ceil(d / 20))));

    const newFeatures = pointGroups.map((points, i) => {
      return this.fitGreatCircle(points, nSegments[i]).map((arc) => new Feature({
        geometry: new LineString(arc.coords.map((c) => fromLonLat(c, viewProjection))),
      }));
    }).flat();

    const metersPerPixel = unitsPerPixel * this.map.getView().getProjection().getMetersPerUnit();
    // draw a distance marker every 10 pixels
    var markerEvery = Math.ceil(Math.log10(10 * metersPerPixel));
    // convert to meters
    markerEvery = Math.pow(10, markerEvery); // TODO allow markers at 5s as well as 1s
    // TODO find currently visible segment from the previously fit great circles, then
    // 1. find 90degree (or smaller) point, figure out how many segments would produce points
    // at every required multiple of meters
    const segmentLength = getDistance(pointGroups[1][1], pointGroups[1][0]); // point to antipode
    const nSegmentsToGetOneEveryMarker = Math.ceil(segmentLength / markerEvery);
    const markerBasis = this.fitGreatCircle(pointGroups[1], nSegmentsToGetOneEveryMarker);
    // 2. fit a new, short 1-segment linestring through every of those points, at the mean angle of
    // the segment before and after it in the great circle
    const markerFeatures = markerBasis.map((arc) => arc.coords.map((arcpoint, i) => {
      const start = arc.coords[Math.max(0, i - 1)];
      const end = arc.coords[Math.min(i + 1, arc.length - 1)]
      const angle = - getRotation([start, end]);

      // fixed length line through the arcpoint at the angle
      const scale = 0.3;
      const markerLine = new LineString([
          [arcpoint[0] - scale*Math.sin(angle), arcpoint[1] - scale*Math.cos(angle) ],
          [arcpoint[0] + scale*Math.sin(angle), arcpoint[1] + scale*Math.cos(angle) ],
        ]);

      // TODO add text with rotation

      // TODO add labels
      return new Feature({
        geometry: markerLine,
        label: distanceString(markerEvery * i),
        rotation: angle+Math.PI/2
      })
    })).flat();

    newFeatures.forEach((f) => f.setStyle(basicStyle));
    markerFeatures.forEach((f) => f.setStyle(textStyle));

    return { circles: newFeatures, labels: markerFeatures };
  }

  addLines = () => {
    if (this.pointSource.getFeatures().length === 0) {
      return;
    }
    this.greatCircleSource.clear();

    // in projection coordinates (because number of segments will depend on pixels)
    const extent = this.map.getView().calculateExtent();

    // in lonlat
    const points = this.pointSource.getFeatures()[0].getGeometry().getCoordinates().map((c) => toLonLat(c, viewProjection));
    const antipodes = points.map(([x, y]) => [x - 180*Math.sign(x), -y]);
    const pointGroups = [
      points,
      [ points[1], antipodes[0] ],
      antipodes,
      [ antipodes[1], points[0] ],
    ];
    // TODO fit ROUGH great circle(s) through all antepodes, calculate visible extent,
    // then generate high-res great circles of those extents only (and add labels etc)

    // TODO use pixel distance
    const nArrowSegments = 30;
    const arrowCoords = this.fitGreatCircle(points, nArrowSegments)[0].coords.map((c) => fromLonLat(c, viewProjection));
    const arrowFeature = new Feature({
      geometry: new LineString(arrowCoords),
    })
    // the first one is the view line: set arrow
    arrowFeature.setStyle(arrowStyle);
    this.greatCircleSource.addFeature(arrowFeature);

    // draw the circle
    if (true) {
      const distance = getDistance(points[0], points[1]);
      const nPoints = 360;
      const recenteredProjection = getStereographicProjection(points[0]);
      const point = fromLonLat(points[1], recenteredProjection);
      const circlePoints = Array.from({length: nPoints}, (x, i) => {
        // rotation around the center of the stereographic preserves distance
        rotate(point, 2 * Math.PI / nPoints);
        return transform(point, recenteredProjection, viewProjection);
      });
      const circleFeature = new Feature({
        geometry: new LineString([...circlePoints, circlePoints[0]]),
      })
      circleStyle.getText().setText(distanceString(distance));
      circleFeature.setStyle(circleStyle);
      this.greatCircleSource.addFeature(circleFeature);
    }

    // draw the distance offsets
    if (true) {
      const features = this.generateLineOfSight(points);
      // TODO improve performance by manipulating collection?
      this.greatCircleSource.addFeatures(features.circles);
      this.greatCircleSource.addFeatures(features.labels);
    }

  }

  componentDidMount = () => {

    const draw = new Draw({
      source: this.pointSource,
      type: 'LineString',
      maxPoints: 2
    });

    draw.on('drawstart', () => {
      this.pointSource.clear();
      this.greatCircleSource.clear();
    });

    const view = new View({
      center: [0, 0],
      zoom: 3,
      projection: viewProjection,
    });

    view.on('change:resolution', this.addLines);
    this.pointSource.on(['addfeature', 'changefeature'], this.addLines);

    this.map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(), //new XYZ({
      //       // mapbox: doesn't always have level 18
      // //      url: 'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=qu62rKisigsebPda2e6b',
      //       url: "https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=Dy8GRe9OwAAQHfnhr24y",
      //       attributions: '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a>',
      //       tileSize: 256,
      //       maxZoom: 20,
      //       crossOrigin: 'anonymous',
      //     }),
        }),
        new VectorLayer({ source: this.greatCircleSource, style: [] }),
        new VectorLayer({ source: this.pointSource, style: [] }),
      ],
      target: 'map',
      view: view,
      interactions: defaultInteractions().extend([
        new Modify({ source: this.pointSource, insertVertexCondition: never }),
        draw,
        new Snap({source: this.pointSource }) ]),
    });
  }

  render = () => {
    return (
      <div id="map">
      </div>
    );
  }
}

export default App;
