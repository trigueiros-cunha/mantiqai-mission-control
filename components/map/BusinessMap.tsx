'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/lib/store'

export default function BusinessMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const { deals, clients } = useStore()

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (mapInstanceRef.current) return
    if (!mapRef.current) return

    // Dynamic import to avoid SSR issues
    const initMap = async () => {
      const L = (await import('leaflet')).default

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      if (!mapRef.current || mapInstanceRef.current) return

      const map = L.map(mapRef.current, {
        center: [39.6, -8.1],
        zoom: 6,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      mapInstanceRef.current = map

      // Client markers (green)
      clients.forEach(client => {
        const marker = L.circleMarker([client.location.lat, client.location.lng], {
          radius: 12,
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.8,
          weight: 2,
        }).addTo(map)
        marker.bindPopup(`
          <div style="font-family: DM Sans, sans-serif; padding: 4px; background: #111520; color: #e4e8f2;">
            <strong>${client.company}</strong><br/>
            <span style="color: #10b981;">${client.plan.toUpperCase()} · €${client.mrr}/mo</span><br/>
            <span style="color: #6d7a96; font-size: 11px;">Health: ${client.health}%</span>
          </div>
        `)
      })

      // Deal markers (blue)
      deals.filter(d => d.stage !== 'delivered').forEach(deal => {
        const marker = L.circleMarker([deal.location.lat, deal.location.lng], {
          radius: 8,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.6,
          weight: 2,
        }).addTo(map)
        marker.bindPopup(`
          <div style="font-family: DM Sans, sans-serif; padding: 4px;">
            <strong style="color: #e4e8f2;">${deal.company}</strong><br/>
            <span style="color: #3b82f6;">${deal.stage.toUpperCase()}</span><br/>
            <span style="color: #6d7a96; font-size: 11px;">€${deal.value.setup + deal.value.monthly}/mo</span>
          </div>
        `)
      })

    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '500px' }}
    />
  )
}
