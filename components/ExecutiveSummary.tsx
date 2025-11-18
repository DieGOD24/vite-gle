import React, { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, LineChart, Line
} from 'recharts';
import { User, Role, Visit, Prospect, Closure, VisitType } from '../types';
import KpiCard from './ui/KpiCard';
import AIInsights from './ui/AIInsights';

interface ExecutiveSummaryProps {
    visits: Visit[];
    prospects: Prospect[];
    closures: Closure[];
    previousData: {
        visits: Visit[];
        prospects: Prospect[];
        closures: Closure[];
    };
    user: User;
    users: User[];
    selectedCommercialName?: string;
    selectedRegion: string;
    dateRange: { start: string; end: string };
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
    visits, prospects, closures, previousData, user, users, selectedCommercialName, selectedRegion, dateRange
}) => {
    
    // --- CORRECCIÓN DE FECHAS (BUG UTC) ---
    // (Esta parte ya estaba bien, asegura que los filtros de fecha usen la hora local)
    const { cleanVisits, cleanProspects, cleanClosures, cleanPrevVisits, cleanPrevProspects, cleanPrevClosures } = useMemo(() => {
        const start = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : null;
        const end = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : null;

        if (!start || !end) {
            return { 
                cleanVisits: visits.filter(Boolean), 
                cleanProspects: prospects.filter(Boolean), 
                cleanClosures: closures.filter(Boolean),
                cleanPrevVisits: previousData.visits.filter(Boolean),
                cleanPrevProspects: previousData.prospects.filter(Boolean),
                cleanPrevClosures: previousData.closures.filter(Boolean)
            };
        }

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const prevStart = new Date(start);
        prevStart.setDate(start.getDate() - diffDays);
        const prevEnd = new Date(start);
        prevEnd.setDate(start.getDate() - 1);
        prevEnd.setHours(23,59,59,999);

        const filterByDate = (item: Visit | Prospect | Closure, s: Date, e: Date) => {
            const itemDateStr = 'fecha_hora' in item ? item.fecha_hora : 'fecha_registro' in item ? item.fecha_registro : item.fecha_cierre;
            if (!itemDateStr) return false;
            const itemDate = new Date(itemDateStr);
            return itemDate >= s && itemDate <= e;
        };

        return {
            cleanVisits: visits.filter(Boolean).filter(v => filterByDate(v, start, end)),
            cleanProspects: prospects.filter(Boolean).filter(p => filterByDate(p, start, end)),
            cleanClosures: closures.filter(Boolean).filter(c => filterByDate(c, start, end)),
            cleanPrevVisits: previousData.visits.filter(Boolean).filter(v => filterByDate(v, prevStart, prevEnd)),
            cleanPrevProspects: previousData.prospects.filter(Boolean).filter(p => filterByDate(p, prevStart, prevEnd)),
            cleanPrevClosures: previousData.closures.filter(Boolean).filter(c => filterByDate(c, prevStart, prevEnd))
        };
    }, [visits, prospects, closures, previousData, dateRange]);


    const mainChartData = useMemo(() => {
        if (selectedCommercialName || user.cargo === Role.COMERCIAL) {
            const counts: Record<string, number> = {};
            cleanVisits.forEach(visit => {
                const date = new Date(visit.fecha_hora).toLocaleDateString('es-CO');
                counts[date] = (counts[date] || 0) + 1;
            });
            const parseDMY = (dateString: string) => {
                const [day, month, year] = dateString.split('/').map(Number);
                return new Date(year, month - 1, day);
            };
            return Object.entries(counts)
                .map(([name, count]) => ({ name, visitas: count }))
                .sort((a, b) => parseDMY(a.name).getTime() - parseDMY(b.name).getTime());
        }

        const userRegionMap = new Map<string, string>();
        users.filter(Boolean).forEach(u => userRegionMap.set(u.cedula, u.regional));

        const countsByRegion: Record<string, number> = {};
        cleanVisits.forEach(visit => {
            const region = userRegionMap.get(visit.cedula_ejecutivo);
            if (typeof region === 'string') {
                countsByRegion[region] = (countsByRegion[region] || 0) + 1;
            }
        });

        return Object.entries(countsByRegion)
            .map(([name, count]) => ({ name, visitas: count }))
            .sort((a, b) => b.visitas - a.visitas);
    }, [cleanVisits, selectedCommercialName, user, users]);

    
    const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100.0 : 0.0;
        return ((current - previous) / previous) * 100;
    };

    const visitsTrend = calculateTrend(cleanVisits.length, cleanPrevVisits.length);
    const prospectsTrend = calculateTrend(cleanProspects.length, cleanPrevProspects.length);
    const closuresTrend = calculateTrend(cleanClosures.length, cleanPrevClosures.length);
    const conversionRate = cleanProspects.length > 0 ? (cleanClosures.length / cleanProspects.length) * 100 : 0;
    const prevConversionRate = cleanPrevProspects.length > 0 ? (cleanPrevClosures.length / cleanPrevProspects.length) * 100 : 0;
    const conversionTrend = conversionRate - prevConversionRate;

    // --- ¡CORRECCIÓN DEL BUG DE VALOR! ---
    // Usamos Number(c.valor_estimado) para forzar la conversión
    const totalSalesValue = useMemo(() => cleanClosures.reduce((sum: number, c: Closure) => sum + (Number(c.valor_estimado) || 0), 0), [cleanClosures]);
    const prevTotalSalesValue = useMemo(() => cleanPrevClosures.reduce((sum: number, c: Closure) => sum + (Number(c.valor_estimado) || 0), 0), [cleanPrevClosures]);
    
    const averageDealSize = cleanClosures.length > 0 ? totalSalesValue / cleanClosures.length : 0;
    const prevAverageDealSize = cleanPrevClosures.length > 0 ? prevTotalSalesValue / cleanPrevClosures.length : 0;
    const salesValueTrend = calculateTrend(totalSalesValue, prevTotalSalesValue);
    const avgDealSizeTrend = calculateTrend(averageDealSize, prevAverageDealSize);

    const PIE_COLORS = { [VisitType.PROSPECTO]: '#c00000', [VisitType.MANTENIMIENTO]: '#444444', [VisitType.CIERRE]: '#9E9E9E' };

    const visitsByType = useMemo(() => {
        const counts: Record<VisitType, number> = { [VisitType.PROSPECTO]: 0, [VisitType.MANTENIMIENTO]: 0, [VisitType.CIERRE]: 0 };
        cleanVisits.forEach(visit => {
            if (counts[visit.motivo] !== undefined) {
                 counts[visit.motivo] = (counts[visit.motivo] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [cleanVisits]);

    const regionalPerformanceData = useMemo(() => {
        const REGIONS = ['Bogotá', 'Medellín', 'Barranquilla', 'Cali'] as const;
        type Region = typeof REGIONS[number];
        type RegionData = { name: Region; Prospectos: number; Cierres: number };
        const userRegionMap = new Map<string, string>();
        users.filter(Boolean).forEach(u => userRegionMap.set(u.cedula, u.regional));

        const dataByRegion: Record<Region, RegionData> = {
            'Bogotá': { name: 'Bogotá', Prospectos: 0, Cierres: 0 },
            'Medellín': { name: 'Medellín', Prospectos: 0, Cierres: 0 },
            'Barranquilla': { name: 'Barranquilla', Prospectos: 0, Cierres: 0 },
            'Cali': { name: 'Cali', Prospectos: 0, Cierres: 0 },
        };

        cleanProspects.forEach(p => {
            const region = userRegionMap.get(p.comercial_cedula);
            if (typeof region === 'string' && REGIONS.includes(region as Region)) {
                dataByRegion[region as Region].Prospectos++;
            }
        });

        cleanClosures.forEach(c => {
            const region = userRegionMap.get(c.comercial_cedula);
            if (typeof region === 'string' && REGIONS.includes(region as Region)) {
                dataByRegion[region as Region].Cierres++;
            }
        });

        return Object.values(dataByRegion);
    }, [cleanProspects, cleanClosures, users]);

    const activityByDay = useMemo(() => {
        const dataByDate = new Map<string, { date: string; displayDate: string; Visitas: number; Prospectos: number; Cierres: number }>();

        const processItems = (items: (Visit | Prospect | Closure)[], type: 'Visitas' | 'Prospectos' | 'Cierres') => {
            items.forEach(item => {
                const itemDateStr = 'fecha_hora' in item ? item.fecha_hora : 'fecha_registro' in item ? item.fecha_registro : (item as Closure).fecha_cierre;
                if (!itemDateStr) return; 
                
                const itemDate = new Date(itemDateStr);
                const dateKey = itemDate.toISOString().split('T')[0];
                
                if (!dataByDate.has(dateKey)) {
                    dataByDate.set(dateKey, {
                        date: dateKey,
                        displayDate: itemDate.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
                        Visitas: 0,
                        Prospectos: 0,
                        Cierres: 0
                    });
                }
                const dayData = dataByDate.get(dateKey)!;
                dayData[type]++;
            });
        };

        processItems(cleanVisits, 'Visitas');
        processItems(cleanProspects, 'Prospectos');
        processItems(cleanClosures, 'Cierres');

        return Array.from(dataByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
    }, [cleanVisits, cleanProspects, cleanClosures]);

    const title = user.cargo === Role.COMERCIAL
        ? user.nombre
        : (selectedCommercialName || selectedRegion || "Consolidado Nacional");

    const aiScope = selectedCommercialName || selectedRegion || "Nacional";

    const usersForAI = useMemo(() => {
        if (selectedCommercialName) return users.filter(u => u.nombre === selectedCommercialName);
        if (selectedRegion) return users.filter(u => u.regional === selectedRegion);
        return users;
    }, [users, selectedCommercialName, selectedRegion]);

    const mainChartTitle = selectedCommercialName
        ? `Visitas Diarias de ${selectedCommercialName}`
        : (user.cargo === Role.COMERCIAL ? 'Mis Visitas Diarias' : 'Total de Visitas por Región');

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-800">{(user.cargo === Role.COMERCIAL ? 'Mis Registros' : 'Resumen Ejecutivo')}: {title}</h2>
            {user.cargo !== Role.COMERCIAL && (
                <AIInsights data={{
                    visits: cleanVisits, prospects: cleanProspects, closures: cleanClosures, totalSalesValue, conversionRate,
                    visitsTrend, prospectsTrend, closuresTrend, salesValueTrend, conversionTrend,
                    users: usersForAI, dateRange, scope: aiScope
                }} />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Visitas Totales" value={cleanVisits.length} icon="fa-route" color="gle-blue" comparisonValue={visitsTrend} comparisonPeriod="vs. período ant."/>
                <KpiCard title="Prospectos Nuevos" value={cleanProspects.length} icon="fa-user-plus" color="gle-red" comparisonValue={prospectsTrend} comparisonPeriod="vs. período ant."/>
                <KpiCard title="Cierres Realizados" value={cleanClosures.length} icon="fa-handshake" color="gle-gray" comparisonValue={closuresTrend} comparisonPeriod="vs. período ant."/>
                
                {/* Eliminamos este KPI porque 'duracion_minutos' no existe en el tipo 'Visit' 
                  (basado en el 'types.ts' que corregimos)
                */}
                {/* <KpiCard title="Duración Prom. de Visita" value={`${averageVisitDuration.toFixed(0)} min`} icon="fa-clock" color="gle-gray" comparisonValue={avgDurationTrend} comparisonPeriod="vs. período ant."/> */}
                
                <KpiCard title="Valor Total Cierres" value={`$${totalSalesValue.toLocaleString('es-CO')}`} icon="fa-dollar-sign" color="gle-blue" comparisonValue={salesValueTrend} comparisonPeriod="vs. período ant."/>
                <KpiCard title="Ticket Promedio" value={`$${averageDealSize.toLocaleString('es-CO', { maximumFractionDigits: 0 })}`} icon="fa-receipt" color="gle-red" comparisonValue={avgDealSizeTrend} comparisonPeriod="vs. período ant."/>
                <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center justify-center lg:col-span-2">
                    <h3 className="text-gray-500 text-sm font-medium mb-1">Tasa de Conversión</h3>
                    <ResponsiveContainer width="100%" height={80}>
                        <RadialBarChart
                            innerRadius="70%"
                            outerRadius="90%"
                            data={[{ name: 'Conversion', value: conversionRate }]}
                            startAngle={180}
                            endAngle={0}
                            barSize={20}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                            <RadialBar background dataKey="value" cornerRadius={10} fill="#c00000" />
                            <text x="50%" y="70%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current text-gle-gray-dark">
                                {`${conversionRate.toFixed(1)}%`}
                            </text>
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <p className={`text-xs font-semibold ${conversionTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {conversionTrend >= 0 ? '+' : ''}{conversionTrend.toFixed(1)} pts vs. período ant.
                    </p>
                </div>
            </div>
            {/* ... (El resto del JSX no cambia) ... */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-3">
                    <h3 className="text-lg font-semibold mb-4">{mainChartTitle}</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={mainChartData}
                            layout={user.cargo === Role.COMERCIAL || selectedCommercialName ? "horizontal" : "vertical"}
                            margin={{ top: 5, right: 30, left: (user.cargo === Role.COMERCIAL || selectedCommercialName ? 20 : 60), bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            {user.cargo === Role.COMERCIAL || selectedCommercialName ? <XAxis dataKey="name" /> : <XAxis type="number" allowDecimals={false} />}
                            {user.cargo === Role.COMERCIAL || selectedCommercialName ? <YAxis /> : <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />}
                            <Tooltip />
                            <Bar dataKey="visitas" fill="#c00000" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Desglose por Tipo de Visita</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={visitsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                {visitsByType.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[entry.name as VisitType]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {user.cargo !== Role.COMERCIAL && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-2">
                        <h3 className="text-lg font-semibold mb-4">Rendimiento por Región</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={regionalPerformanceData} layout="vertical" margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Prospectos" fill="#c00000" />
                                <Bar dataKey="Cierres" fill="#444444" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-3">
                        <h3 className="text-lg font-semibold mb-4">Tendencia de Actividad</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={activityByDay} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="displayDate" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="Visitas" stroke="#0d6efd" strokeWidth={2} />
                                <Line type="monotone" dataKey="Prospectos" stroke="#c00000" strokeWidth={2} />
                                <Line type="monotone" dataKey="Cierres" stroke="#444444" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExecutiveSummary;