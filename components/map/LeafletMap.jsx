'use client'
import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x?.src || markerIcon2x,
  iconUrl: markerIcon?.src || markerIcon,
  shadowUrl: markerShadow?.src || markerShadow,
})


function Recenter({ center, zoom }) {
  const map = useMap()
  useEffect(() => {
    if (Array.isArray(center) && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.setView(center, typeof zoom === 'number' ? zoom : map.getZoom())
    }
  }, [center?.[0], center?.[1], zoom])
  return null
}

export default function LeafletMap({ center=[14.5995,120.9842], zoom=6, points=[], onMarkerClick, onMarkerHover }) {
  return (
    <MapContainer center={center} zoom={zoom} className="w-full h-full">
      <Recenter center={center} zoom={zoom} />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                 attribution="&copy; OpenStreetMap contributors" />
      {points.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]} eventHandlers={{
          click: () => onMarkerClick && onMarkerClick(p),
          mouseover: () => onMarkerHover && onMarkerHover(p),
        }}>
          <Tooltip>{p.name}</Tooltip>
          <Popup>
            <b>{p.name}</b><br/>{p.extra || ''}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}