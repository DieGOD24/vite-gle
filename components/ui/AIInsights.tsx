
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Visit, Prospect, Closure, User } from '../../types';

// Simple markdown to HTML renderer
const MarkdownRenderer = ({ content }: { content: string }) => {
    const htmlContent = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // New lines
    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

interface AIInsightsProps {
    data: {
        visits: Visit[];
        prospects: Prospect[];
        closures: Closure[];
        totalSalesValue: number;
        conversionRate: number;
        visitsTrend: number;
        prospectsTrend: number;
        closuresTrend: number;
        salesValueTrend: number;
        conversionTrend: number;
        users: User[];
        dateRange: { start: string; end: string };
        scope: string;
    };
}

const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
    const [summary, setSummary] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const generateInsights = async () => {
        setLoading(true);
        setError('');
        setSummary('');

        if(data.visits.length === 0 && data.prospects.length === 0 && data.closures.length === 0) {
            setError('No hay datos suficientes en el período seleccionado para generar un análisis.');
            setLoading(false);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const commercialPerformance = data.users
                .map(user => {
                    const userVisits = data.visits.filter(v => v.cedula_ejecutivo === user.cedula).length;
                    const userProspects = data.prospects.filter(p => p.cedula_comercial === user.cedula).length;
                    const userClosures = data.closures.filter(c => c.cedula_comercial === user.cedula).length;
                    return { name: user.nombre, visits: userVisits, prospects: userProspects, closures: userClosures, total: userVisits + userProspects + userClosures };
                })
                .filter(u => u.total > 0)
                .sort((a, b) => b.total - a.total)
                .slice(0, 3);
            
            const prompt = `
              Actúa como un analista de ventas senior para la empresa GLE Colombia. A continuación, te presento los datos de rendimiento de ventas para el período del ${data.dateRange.start} al ${data.dateRange.end} para el ámbito de '${data.scope}'.

              Métricas Clave:
              - Visitas Totales: ${data.visits.length} (Tendencia vs. período anterior: ${data.visitsTrend.toFixed(1)}%)
              - Prospectos Nuevos: ${data.prospects.length} (Tendencia: ${data.prospectsTrend.toFixed(1)}%)
              - Cierres Realizados: ${data.closures.length} (Tendencia: ${data.closuresTrend.toFixed(1)}%)
              - Valor Total de Cierres: $${data.totalSalesValue.toLocaleString('es-CO')} (Tendencia: ${data.salesValueTrend.toFixed(1)}%)
              - Tasa de Conversión: ${data.conversionRate.toFixed(1)}% (Tendencia: ${data.conversionTrend.toFixed(1)} puntos)

              Desempeño por Comercial (Top 3 por actividad total):
              ${commercialPerformance.length > 0 ? commercialPerformance.map((u, i) => `${i + 1}. ${u.name}: ${u.visits} visitas, ${u.prospects} prospectos, ${u.closures} cierres.`).join('\n') : 'No hay datos de comerciales individuales.'}

              Basado en estos datos, proporciona un resumen ejecutivo conciso (máximo 3 párrafos) que incluya:
              1. Un resumen del rendimiento general.
              2. Identificación de los puntos fuertes y áreas de mejora clave.
              3. Dos recomendaciones accionables y concretas para la gerencia para mejorar los resultados.

              Formatea tu respuesta en Markdown, usando **negritas** para resaltar los puntos importantes. No incluyas un título. Tu respuesta debe ser profesional, directa y basada exclusivamente en los datos proporcionados.
            `;

            const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
            });
            
            setSummary(response.text);

        } catch (e) {
            console.error(e);
            setError('Ocurrió un error al generar el análisis. Por favor, intente de nuevo.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="bg-gradient-to-br from-gle-gray-dark to-gle-gray p-6 rounded-lg shadow-xl text-white">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-3">
                    <i className="fas fa-brain text-3xl text-red-400"></i>
                    <div>
                        <h3 className="text-xl font-bold">Análisis con IA</h3>
                        <p className="text-sm text-gray-300">Resumen ejecutivo generado por Gemini</p>
                    </div>
                </div>
                <button 
                    onClick={generateInsights} 
                    disabled={loading}
                    className="bg-gle-red text-white font-semibold py-2 px-5 rounded-lg hover:bg-red-700 transition duration-300 flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-wand-magic-sparkles"></i>}
                    <span>{loading ? 'Generando...' : 'Generar Análisis'}</span>
                </button>
            </div>
            {error && <div className="bg-red-800 bg-opacity-50 border border-red-500 p-3 rounded-md text-center">{error}</div>}
            {summary && (
                <div className="mt-4 bg-black bg-opacity-20 p-4 rounded-md text-sm leading-relaxed">
                   <MarkdownRenderer content={summary} />
                </div>
            )}
        </div>
    );
};

export default AIInsights;
