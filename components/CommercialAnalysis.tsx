import React, { useState, useMemo } from 'react';
import { User, Visit, Prospect, Closure, VisitType } from '../types';
import KpiCard from './ui/KpiCard';
import DataTable from './ui/DataTable';
import MapModal from './ui/MapModal';

// --- Interfaces ---
interface CommercialAnalysisProps {
  commercialUsers: User[];
  visits: Visit[];
  prospects: Prospect[];
  closures: Closure[];
  onValidateVisit: (visitId: string) => void;
}

// --- Utilidades ---
const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const d = new Date(date);
  return d.toLocaleDateString('es-CO');
};

const formatDuration = (totalMinutes: number | null | undefined): string => {
  if (!totalMinutes || totalMinutes === 0) return '0 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  let result = '';
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 || hours === 0) result += `${minutes}min`;
  return result.trim();
};

// --- Semáforo ---
const SemaforoCell: React.FC<{ motivo: VisitType; prospect?: Prospect | null }> = ({
  motivo,
  prospect,
}) => {
  const fechaCierre = prospect ? (prospect as any).fecha_posible_cierre : null;

  if (motivo !== VisitType.PROSPECTO || !fechaCierre) {
    return (
      <div className="flex items-center space-x-2" title="No es un prospecto nuevo o no tiene fecha asignada">
        <span className="h-3 w-3 rounded-full bg-white border border-gray-300"></span>
        <span>N/A</span>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closingDate = new Date(fechaCierre);
  closingDate.setHours(0, 0, 0, 0);

  const diffTime = closingDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let color = '';
  let tooltip = '';

  if (diffDays < 0) {
    color = 'bg-gray-400';
    tooltip = 'Vencido';
  } else if (diffDays <= 30) {
    color = 'bg-yellow-400';
    tooltip = 'Corto Plazo (<= 1 mes)';
  } else if (diffDays <= 60) {
    color = 'bg-orange-400';
    tooltip = 'Mediano Plazo (<= 2 meses)';
  } else {
    color = 'bg-red-500';
    tooltip = 'Largo Plazo (> 2 meses)';
  }

  return (
    <div className="flex items-center space-x-2" title={tooltip}>
      <span className={`h-3 w-3 rounded-full ${color}`}></span>
      <span>{formatDate(fechaCierre)}</span>
    </div>
  );
};

// --- Componente principal ---
const CommercialAnalysis: React.FC<CommercialAnalysisProps> = ({
  commercialUsers,
  visits,
  prospects,
  closures,
  onValidateVisit,
}) => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);

  const [selectedCommercialId, setSelectedCommercialId] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'visitas' | 'prospectos' | 'cierres'>('visitas');

  const [dateRange, setDateRange] = useState({
    start: lastMonth.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  });

  const [isMapModalOpen, setMapModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lon: number;
    clientAddress: string;
    id?: string;
    type?: 'visit' | 'prospect' | 'closure';
  } | null>(null);

  // --- Datos memoizados ---
  const selectedCommercialData = useMemo(() => {
    if (!selectedCommercialId) return null;

    const start = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : new Date(0);
    const end = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : new Date();

    const filterByDate = (item: any) => {
      const itemDateStr = item.fecha_hora || item.fecha_registro || item.fecha_cierre;
      if (!itemDateStr) return false;
      const dateToCheck = new Date(itemDateStr);
      return dateToCheck >= start && dateToCheck <= end;
    };

    const commercialVisits = visits.filter(
      (v) => v.cedula_ejecutivo === selectedCommercialId && filterByDate(v)
    );
    const commercialProspects = prospects.filter(
      (p) => p.comercial_cedula === selectedCommercialId && filterByDate(p)
    );
    const commercialClosures = closures.filter(
      (c) => c.comercial_cedula === selectedCommercialId && filterByDate(c)
    );

    const totalVisitDuration = commercialVisits.reduce(
      (sum, visit) => sum + (visit.duracion_minutos || 0),
      0
    );

    // --- CÁLCULO DE TASA DE CONVERSIÓN (CORREGIDO) ---
    // Usamos la misma lógica que en ExecutiveSummary:
    // Si hay prospectos > 0, calculamos porcentaje. Si no, es 0.
    const conversionRate = commercialProspects.length > 0
      ? (commercialClosures.length / commercialProspects.length) * 100
      : 0;

    const latestProspectsByNit = new Map<string, Prospect>();
    [...prospects]
      .sort((a, b) => {
        const tA = a.fecha_registro ? new Date(a.fecha_registro).getTime() : 0;
        const tB = b.fecha_registro ? new Date(b.fecha_registro).getTime() : 0;
        return tB - tA;
      })
      .forEach((p) => {
        if (p.nit && !latestProspectsByNit.has(p.nit)) {
          latestProspectsByNit.set(p.nit, p);
        }
      });

    return {
      info: commercialUsers.find((u) => u.cedula === selectedCommercialId),
      visits: commercialVisits,
      prospects: commercialProspects,
      closures: commercialClosures,
      conversionRate,
      latestProspectsByNit,
      totalVisitDuration,
    };
  }, [selectedCommercialId, commercialUsers, visits, prospects, closures, dateRange]);

  // --- Helper para lat/lon ---
  const getLatLonFromItem = (item: any, type: 'visit' | 'prospect' | 'closure'): { lat?: number; lon?: number; address?: string } => {
    let latRaw = item.lat ?? item.latitud ?? item.latitude;
    let lonRaw = item.lng ?? item.longitud ?? item.longitude;
    const address = item.direccion;

    if ((latRaw == null || lonRaw == null) && type !== 'visit' && item.nit && selectedCommercialId) {
      const matchingVisit = visits.find(v => v.nit === item.nit && v.lat && v.lng);
      if (matchingVisit) {
        latRaw = matchingVisit.lat;
        lonRaw = matchingVisit.lng;
      }
    }

    if (latRaw == null || lonRaw == null) {
      return { lat: undefined, lon: undefined, address };
    }

    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (Number.isNaN(lat) || Number.isNaN(lon) || (lat === 0 && lon === 0)) {
      return { lat: undefined, lon: undefined, address };
    }
    return { lat, lon, address };
  };

  // --- Renderizado de Pestañas ---
  const renderSubTabContent = () => {
    if (!selectedCommercialData) return null;

    const { visits, prospects, closures, latestProspectsByNit } = selectedCommercialData;

    const openLocationModal = (
      item: Visit | Prospect | Closure,
      type: 'visit' | 'prospect' | 'closure'
    ) => {
      const { lat, lon, address } = getLatLonFromItem(item, type);
      if (lat == null || lon == null) return;

      setSelectedLocation({
        lat,
        lon,
        clientAddress: address || 'Sin dirección',
        id: type === 'visit' ? (item as Visit).id_visita : undefined,
        type,
      });
      setMapModalOpen(true);
    };

    const renderMapIconCell = (
      item: Visit | Prospect | Closure,
      type: 'visit' | 'prospect' | 'closure'
    ) => {
      const { lat, lon } = getLatLonFromItem(item, type);
      if (lat == null || lon == null) {
        return <span className="text-gray-300 text-xs cursor-not-allowed" title="Sin ubicación">N/A</span>;
      }

      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openLocationModal(item, type);
          }}
          className="text-gle-blue hover:text-blue-700 text-xl flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 transition"
          title="Ver ubicación en mapa"
        >
          <i className="fas fa-map-marker-alt"></i>
        </button>
      );
    };

    switch (activeSubTab) {
      case 'visitas':
        return (
          <DataTable
            title="Matriz de Visitas"
            data={visits}
            columns={[
              { key: 'fecha_hora', name: 'Fecha', render: (item: Visit) => formatDate(item.fecha_hora) },
              { key: 'nombre_cliente', name: 'Cliente', render: (item: Visit) => item.nombre_cliente || 'N/A' },
              { key: 'motivo', name: 'Motivo', render: (item: Visit) => item.motivo || 'N/A' },
              {
                key: 'semaforo',
                name: 'Semáforo Cierre',
                render: (item: Visit) => <SemaforoCell motivo={item.motivo} prospect={item.nit ? latestProspectsByNit.get(item.nit) : null} />
              },
              {
                key: 'duracion',
                name: 'Duración',
                render: (item: Visit) => formatDuration(item.duracion_minutos)
              },
              {
                key: 'verificar_ubicacion',
                name: 'Mapa',
                render: (item: Visit) => renderMapIconCell(item, 'visit'),
              },
              { key: 'observaciones', name: 'Observaciones', render: (item: Visit) => item.observaciones || 'N/A' },
            ]}
            emptyMessage="No hay visitas en el rango de fechas seleccionado."
          />
        );

      case 'prospectos':
        return (
          <DataTable
            title="Matriz de Prospectos"
            data={prospects}
            columns={[
              { key: 'fecha_registro', name: 'Fecha Registro', render: (item: Prospect) => formatDate(item.fecha_registro) },
              { key: 'nombre_empresa', name: 'Empresa', render: (item: Prospect) => item.nombre_empresa || 'N/A' },
              { key: 'contacto', name: 'Contacto', render: (item: Prospect) => item.contacto || 'N/A' },
              { key: 'estado', name: 'Estado', render: (item: Prospect) => item.estado || 'N/A' },
              {
                key: 'fecha_posible_cierre',
                name: 'Semáforo Cierre',
                render: (item: Prospect) => <SemaforoCell motivo={VisitType.PROSPECTO} prospect={item} />
              },
              {
                key: 'verificar_ubicacion',
                name: 'Mapa',
                render: (item: Prospect) => renderMapIconCell(item, 'prospect'),
              },
            ]}
            emptyMessage="No hay prospectos en el rango de fechas seleccionado."
          />
        );

      case 'cierres':
        return (
          <DataTable
            title="Matriz de Cierres"
            data={closures}
            columns={[
              { key: 'fecha_cierre', name: 'Fecha', render: (item: Closure) => formatDate(item.fecha_cierre) },
              { key: 'cliente', name: 'Cliente', render: (item: Closure) => item.cliente || 'N/A' },
              { key: 'tipo_cierre', name: 'Tipo', render: (item: Closure) => item.tipo_cierre || 'N/A' },
              {
                key: 'valor_estimado',
                name: 'Valor',
                render: (item: Closure) => {
                  const i = item as any;
                  const val = i.valor_estimado ?? i.valor;
                  if (val !== undefined && val !== null) {
                    return `$${Number(val).toLocaleString('es-CO')}`;
                  }
                  return 'N/A';
                }
              },
              {
                key: 'verificar_ubicacion',
                name: 'Mapa',
                render: (item: Closure) => renderMapIconCell(item, 'closure'),
              },
            ]}
            emptyMessage="No hay cierres en el rango de fechas seleccionado."
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">
        Análisis por Ejecutivo Comercial
      </h2>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <label htmlFor="commercial-select" className="block text-lg font-medium text-gray-800">
          Seleccionar Ejecutivo
        </label>
        <select
          id="commercial-select"
          value={selectedCommercialId}
          onChange={(e) => setSelectedCommercialId(e.target.value)}
          className="mt-2 block w-full p-3 border border-gray-300 rounded-md shadow-sm text-lg"
        >
          <option value="">-- Busque un ejecutivo por nombre --</option>
          {commercialUsers.map((u) => (
            <option key={u.cedula} value={u.cedula}>
              {u.nombre} - {u.regional}
            </option>
          ))}
        </select>
      </div>

      {selectedCommercialData ? (
        <>
          <div className="bg-white p-4 shadow-md grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-2xl font-bold text-gle-red">
              {selectedCommercialData.info?.nombre}
            </h3>
            <p className="text-md text-gray-600">
              {selectedCommercialData.info?.cargo} - {selectedCommercialData.info?.regional}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <KpiCard
              title="Visitas Totales"
              value={selectedCommercialData.visits.length}
              icon="fa-route"
              color="gle-red"
            />
            <KpiCard
              title="Prospectos Nuevos"
              value={selectedCommercialData.prospects.length}
              icon="fa-user-plus"
              color="gle-gray"
            />
            <KpiCard
              title="Cierres Realizados"
              value={selectedCommercialData.closures.length}
              icon="fa-handshake"
              color="gle-gray"
            />
            <KpiCard
              title="Tiempo Total en Visitas"
              value={formatDuration(selectedCommercialData.totalVisitDuration)}
              icon="fa-hourglass-half"
              color="gle-blue"
            />
            <KpiCard
              title="Tasa de Conversión"
              value={`${selectedCommercialData.conversionRate.toFixed(1)}%`}
              icon="fa-percent"
              color="gle-red"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="text-md font-semibold text-gle-gray-dark mb-3">Leyenda del Semáforo de Cierre</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                    <span className="text-sm text-gray-600">Corto Plazo (&lt;= 1 mes)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-orange-400"></span>
                    <span className="text-sm text-gray-600">Mediano Plazo (&lt;= 2 meses)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-red-500"></span>
                    <span className="text-sm text-gray-600">Largo Plazo (&gt; 2 meses)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="h-3 w-3 rounded-full bg-white border border-gray-300"></span>
                    <span className="text-sm text-gray-600">No Aplica / Sin Fecha</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {(['visitas', 'prospectos', 'cierres'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeSubTab === tab
                        ? 'border-gle-red text-gle-red'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>
            <div className="mt-6">{renderSubTabContent()}</div>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <i className="fas fa-search text-4xl text-gray-400 mb-4"></i>
          <p className="text-lg text-gray-600">
            Seleccione un ejecutivo para ver sus métricas detalladas.
          </p>
        </div>
      )}

      {isMapModalOpen && selectedLocation && (
        <MapModal
          commercialLocation={{
            lat: selectedLocation.lat,
            lng: selectedLocation.lon,
          }}
          clientAddress={selectedLocation.clientAddress}
          onClose={() => {
            setMapModalOpen(false);
            setSelectedLocation(null);
          }}
          visitId={selectedLocation.type === 'visit' ? selectedLocation.id : undefined}
          onValidate={
            selectedLocation.type === 'visit' ? onValidateVisit : undefined
          }
        />
      )}
    </div>
  );
};

export default CommercialAnalysis;