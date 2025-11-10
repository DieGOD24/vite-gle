import React, { useState, useEffect } from 'react';
import { User, Visit, Prospect, Closure, VisitType } from '../types';

interface ActiveVisit {
    clientName: string;
    clientNit: string;
    startTime: number;
}

interface RegistrationFormProps {
    user: User;
    activeVisit: ActiveVisit | null;
    onStartVisit: (clientName: string, clientNit: string) => void;
    onRegisterVisit: (visit: Visit) => void;
    onAddProspect: (prospect: Prospect) => void;
    onAddClosure: (closure: Closure) => void;
    onClearActiveVisit: () => void;
}

type LocationStatus = 'idle' | 'pending' | 'success' | 'error';

const LocationStatusIndicator: React.FC<{ status: LocationStatus; onRetry: () => void }> = ({ status, onRetry }) => {
    switch (status) {
        case 'pending':
            return (
                <div className="flex items-center space-x-2 text-gray-600 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                    <i className="fas fa-spinner fa-spin"></i>
                    <span>Capturando ubicación... (Por favor, acepte el permiso en su navegador)</span>
                </div>
            );
        case 'success':
            return (
                <div className="flex items-center space-x-2 text-green-800 p-3 bg-green-100 border border-green-300 rounded-md">
                    <i className="fas fa-check-circle"></i>
                    <span>Ubicación capturada correctamente.</span>
                </div>
            );
        case 'error':
            return (
                <div className="flex items-center justify-between text-red-800 p-3 bg-red-100 border border-red-300 rounded-md">
                    <div className="flex items-center space-x-2">
                        <i className="fas fa-times-circle"></i>
                        <span>No se pudo obtener la ubicación.</span>
                    </div>
                    <button onClick={onRetry} className="text-sm font-bold text-red-800 hover:underline">Reintentar</button>
                </div>
            );
        default:
            return null;
    }
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({ user, activeVisit, onStartVisit, onRegisterVisit, onAddProspect, onAddClosure, onClearActiveVisit }) => {
    const [startFormData, setStartFormData] = useState({ clientName: '', clientNit: '' });
    const [finalFormData, setFinalFormData] = useState<any>({});
    const [outcomeType, setOutcomeType] = useState<VisitType>(VisitType.MANTENIMIENTO);
    const [showSuccess, setShowSuccess] = useState(false);
    const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

    const getLocation = () => {
        setLocationStatus('pending');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
                setLocationStatus('success');
            },
            () => setLocationStatus('error'),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (activeVisit && locationStatus === 'idle') {
            getLocation();
        }
    }, [activeVisit, locationStatus]);

    const handleStartFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setStartFormData({ ...startFormData, [e.target.name]: e.target.value });
    };

    const handleFinalFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFinalFormData({ ...finalFormData, [e.target.name]: e.target.value });
    };

    const handleStartVisit = (e: React.FormEvent) => {
        e.preventDefault();
        onStartVisit(startFormData.clientName, startFormData.clientNit);
    };

    const resetFinalState = () => {
        setFinalFormData({});
        setStartFormData({ clientName: '', clientNit: '' });
        setOutcomeType(VisitType.MANTENIMIENTO);
        setLocation(null);
        setLocationStatus('idle');
    }

    const handleFinalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVisit) return;

        const duration = Math.round((Date.now() - activeVisit.startTime) / 60000); // in minutes
        const locationData = { latitud: location?.lat, longitud: location?.lon };

        const visitMotivo = finalFormData.motivo || outcomeType;

        const newVisit: Visit = {
            id: `V-${Date.now()}`,
            cedula_ejecutivo: user.cedula,
            nombre_ejecutivo: user.nombre,
            cliente: activeVisit.clientName,
            nit: activeVisit.clientNit,
            direccion: finalFormData.direccion || '',
            contacto: finalFormData.contacto || '',
            telefono: finalFormData.telefono || '',
            correo: finalFormData.correo || '',
            motivo: visitMotivo,
            fecha_hora: new Date(),
            observaciones: finalFormData.observaciones || '',
            duracion_minutos: duration,
            ...locationData,
        };
        onRegisterVisit(newVisit);

        if (visitMotivo === VisitType.PROSPECTO) {
            const newProspect: Prospect = {
                id: `P-${Date.now()}`,
                cedula_comercial: user.cedula,
                nombre_empresa: activeVisit.clientName,
                nit: activeVisit.clientNit,
                direccion: finalFormData.direccion,
                ciudad: finalFormData.ciudad,
                contacto: finalFormData.contacto,
                telefono: finalFormData.telefono,
                correo: finalFormData.correo,
                sector: finalFormData.sector,
                compromisos: finalFormData.compromisos,
                fecha_registro: new Date(),
                fecha_posible_cierre: new Date(finalFormData.fecha_posible_cierre),
                estado: 'Contactado',
                ...locationData
            };
            onAddProspect(newProspect);
        } else if (visitMotivo === VisitType.CIERRE) {
            const newClosure: Closure = {
                id: `C-${Date.now()}`,
                cedula_comercial: user.cedula,
                cliente: activeVisit.clientName,
                nit: activeVisit.clientNit,
                direccion: finalFormData.direccion,
                contacto: finalFormData.contacto,
                telefono: finalFormData.telefono,
                correo: finalFormData.correo,
                tipo_cierre: finalFormData.tipo_cierre,
                fecha_cierre: new Date(),
                valor: Number(finalFormData.valor) || 0,
                ...locationData
            };
            onAddClosure(newClosure);
        }

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClearActiveVisit();
            resetFinalState();
        }, 3000);
    };

    const renderFinalFormFields = () => {
        const commonFields = (
            <>
                <InputField label="Dirección" name="direccion" value={finalFormData.direccion || ''} onChange={handleFinalFormChange} required />
                <InputField label="Persona de Contacto" name="contacto" value={finalFormData.contacto || ''} onChange={handleFinalFormChange} required />
                <InputField label="Teléfono" name="telefono" type="tel" value={finalFormData.telefono || ''} onChange={handleFinalFormChange} required />
                <InputField label="Correo Electrónico" name="correo" type="email" value={finalFormData.correo || ''} onChange={handleFinalFormChange} required />
            </>
        );

        switch (outcomeType) {
            case VisitType.PROSPECTO:
                return (
                    <>
                        {commonFields}
                        <InputField label="Ciudad" name="ciudad" value={finalFormData.ciudad || ''} onChange={handleFinalFormChange} required />
                        <InputField label="Sector / Actividad" name="sector" value={finalFormData.sector || ''} onChange={handleFinalFormChange} required />
                        <InputField label="Fecha Posible Cierre" name="fecha_posible_cierre" type="date" value={finalFormData.fecha_posible_cierre || ''} onChange={handleFinalFormChange} required />
                        <TextAreaField label="Compromisos" name="compromisos" value={finalFormData.compromisos || ''} onChange={handleFinalFormChange} required />
                    </>
                );
            case VisitType.MANTENIMIENTO:
                return (
                    <>
                        {commonFields}
                        <TextAreaField label="Motivo / Tema Tratado (Observaciones)" name="observaciones" value={finalFormData.observaciones || ''} onChange={handleFinalFormChange} required />
                    </>
                );
            case VisitType.CIERRE:
                return (
                    <>
                        {commonFields}
                        <SelectField label="Tipo de Cierre" name="tipo_cierre" options={['Nuevo', 'Renovación']} value={finalFormData.tipo_cierre || ''} onChange={handleFinalFormChange} required />
                        <InputField label="Valor del Cierre" name="valor" type="number" value={finalFormData.valor || ''} onChange={handleFinalFormChange} required/>
                    </>
                );
            default: return null;
        }
    };
    
    if (showSuccess) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <i className="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                <h3 className="text-2xl font-bold text-gray-800">¡Registro Guardado!</h3>
                <p className="text-gray-600 mt-2">La información ha sido almacenada correctamente.</p>
            </div>
        );
    }

    if (!activeVisit) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Visita</h2>
                <p className="text-gray-600 mb-6">Completa los datos del cliente para iniciar el cronómetro de la visita.</p>
                <form onSubmit={handleStartVisit} className="space-y-6">
                    <InputField label="Nombre Cliente / Empresa" name="clientName" value={startFormData.clientName} onChange={handleStartFormChange} required />
                    <InputField label="NIT del Cliente" name="clientNit" value={startFormData.clientNit} onChange={handleStartFormChange} required />
                    <div className="pt-2">
                        <button type="submit" className="w-full bg-gle-red text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center space-x-2 text-lg">
                            <i className="fas fa-play-circle"></i>
                            <span>Iniciar Visita</span>
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gle-red mb-6">Registrar Resultado de Visita a: {activeVisit.clientName}</h2>
            <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <LocationStatusIndicator status={locationStatus} onRetry={getLocation} />
                    </div>
                    <div className="md:col-span-2">
                       <SelectField 
                            label="Resultado de la Visita" 
                            name="outcomeType" 
                            value={outcomeType}
                            options={Object.values(VisitType)} 
                            onChange={(e) => setOutcomeType(e.target.value as VisitType)} 
                            required 
                        />
                    </div>
                    {renderFinalFormFields()}
                </div>
                <div className="flex justify-end pt-4">
                     <button type="submit" className="bg-gle-red text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition duration-300 flex items-center space-x-2 disabled:bg-gray-400" disabled={locationStatus !== 'success'}>
                        <i className="fas fa-save"></i>
                        <span>Guardar Registro Final</span>
                     </button>
                </div>
            </form>
        </div>
    );
};

const InputField = ({ label, name, type = 'text', onChange, required = false, value = '' }: { label: string; name: string; type?: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; value?: string }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
        <input type={type} id={name} name={name} onChange={onChange} required={required} value={value} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent" />
    </div>
);

const TextAreaField = ({ label, name, onChange, required = false, value = '' }: { label:string; name:string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; required?: boolean; value?: string }) => (
    <div className="md:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
        <textarea id={name} name={name} rows={4} onChange={onChange} required={required} value={value} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent"></textarea>
    </div>
);

const SelectField = ({ label, name, options, onChange, required = false, value='' }: { label: string; name: string; options: string[]; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; required?: boolean; value?:string }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}{required && ' *'}</label>
        <select id={name} name={name} onChange={onChange} required={required} value={value} className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent bg-white text-gray-900">
            <option value="">Seleccione...</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

export default RegistrationForm;