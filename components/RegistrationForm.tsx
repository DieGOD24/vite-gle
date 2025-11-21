import React, { useState, useEffect } from 'react';
import { User, Visit, Prospect, Closure, VisitType } from '../types';
// Si no usas directamente estos post*, puedes eliminar esta línea
// import { postVisit, postProspect, postClosure } from '../services/api';

interface ActiveVisit {
    clientName: string;
    clientNit: string;
    startTime: number;
}

interface RegistrationFormProps {
    user: User;
    activeVisit: ActiveVisit | null;
    onStartVisit: (clientName: string, clientNit: string) => void;
    onRegisterVisit: (visit: Omit<Visit, 'id_visita' | 'creado_en'>) => Promise<void>;
    onAddProspect: (prospect: Omit<Prospect, 'id_prospecto' | 'creado_en'>) => Promise<void>;
    onAddClosure: (closure: Omit<Closure, 'id_cierre' | 'creado_en'>) => Promise<void>;
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

// ---- Cálculo de tiempo de visita en MINUTOS (para tiempo_visita_min) ----
// Regla:
// - Si el tiempo es <= 0 ms → 0 minutos
// - Si el tiempo es > 0 ms y < 1 minuto → 1 minuto
// - Si el tiempo es >= 1 minuto → floor(minutos)
const getElapsedMinutes = (startTime: number): number => {
    const elapsedMs = Date.now() - startTime;

    if (elapsedMs <= 0) {
        return 0;
    }

    const minutes = Math.floor(elapsedMs / 60000);

    // Si todavía no ha pasado un minuto completo pero es mayor que 0, devolvemos 1
    if (minutes < 1) {
        return 1;
    }

    return minutes;
};

const RegistrationForm: React.FC<RegistrationFormProps> = ({
    user,
    activeVisit,
    onStartVisit,
    onRegisterVisit,
    onAddProspect,
    onAddClosure,
    onClearActiveVisit
}) => {
    const [startFormData, setStartFormData] = useState({ clientName: '', clientNit: '' });
    const [finalFormData, setFinalFormData] = useState<any>({});
    const [outcomeType, setOutcomeType] = useState<VisitType>(VisitType.MANTENIMIENTO);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
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
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeVisit) return;

        try {
            const visitMotivo = finalFormData.motivo || outcomeType;
            if (!['prospecto', 'mantenimiento', 'cierre'].includes(visitMotivo)) {
                throw new Error('Motivo no válido');
            }

            // ---- tiempo_visita_min según el esquema del backend ----
            const tiempo_visita_min = getElapsedMinutes(activeVisit.startTime);

            const newVisit: Omit<Visit, 'id_visita' | 'creado_en'> = {
                nombre_ejecutivo: user.nombre,
                nombre_cliente: activeVisit.clientName,
                nit: activeVisit.clientNit,
                sucursal: finalFormData.sucursal || '',
                direccion: finalFormData.direccion || '',
                contacto: finalFormData.contacto || '',
                correo: finalFormData.correo || '',
                telefono: finalFormData.telefono || '',
                motivo: visitMotivo,
                fecha_hora: new Date().toISOString(),
                lat: location ? location.lat.toFixed(6) : '',
                lng: location ? location.lon.toFixed(6) : '',
                tiempo_visita_min,
                fecha_aprox_cierre: finalFormData.fecha_aprox_cierre || null,
                observaciones: finalFormData.observaciones || '',
                estado: 'registrado',
                creado_por: user.cedula,
                cedula_ejecutivo: user.cedula,
            };

            await onRegisterVisit(newVisit);

            if (visitMotivo === VisitType.PROSPECTO) {
                const newProspect = {
                    comercial_cedula: user.cedula,
                    nombre_empresa: activeVisit.clientName,
                    nit: activeVisit.clientNit,
                    direccion: finalFormData.direccion,
                    ciudad: finalFormData.ciudad,
                    contacto: finalFormData.contacto,
                    telefono: finalFormData.telefono,
                    correo: finalFormData.correo,
                    sector: finalFormData.sector,
                    compromisos: finalFormData.compromisos,
                    fecha_registro: new Date().toISOString().split('T')[0],
                    estado: 'contactado',
                    observaciones: finalFormData.observaciones || '',
                };
                await onAddProspect(newProspect);
            } else if (visitMotivo === VisitType.CIERRE) {
                const newClosure = {
                    comercial_cedula: user.cedula,
                    cliente: activeVisit.clientName,
                    nit: activeVisit.clientNit,
                    direccion: finalFormData.direccion,
                    correo: finalFormData.correo,
                    tipo_cierre: finalFormData.tipo_cierre,
                    fecha_cierre: new Date().toISOString().split('T')[0],
                    valor_estimado: Number(finalFormData.valor) || 0,
                    regional: user.regional,
                    ciudad: finalFormData.ciudad || user.ciudad,
                    observaciones: finalFormData.observaciones || '',
                    compromisos: finalFormData.compromisos || '',
                };
                await onAddClosure(newClosure);
            }

            onClearActiveVisit();
            setShowSuccess(true);
            resetFinalState();
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error("Error al guardar los datos:", error);
            setErrorMessage("Ocurrió un error al guardar los datos. Por favor, inténtalo de nuevo.");
            setShowError(true);
            setTimeout(() => {
                setShowError(false);
                setErrorMessage('');
            }, 5000);
        }
    };

    const renderFinalFormFields = () => {
        const commonFields = (
            <>
                <InputField
                    label="Dirección"
                    name="direccion"
                    value={finalFormData.direccion || ''}
                    onChange={handleFinalFormChange}
                    required
                />
                <InputField
                    label="Persona de Contacto"
                    name="contacto"
                    value={finalFormData.contacto || ''}
                    onChange={handleFinalFormChange}
                    required
                />
                <InputField
                    label="Teléfono"
                    name="telefono"
                    type="tel"
                    value={finalFormData.telefono || ''}
                    onChange={handleFinalFormChange}
                    required
                />
                <InputField
                    label="Correo Electrónico"
                    name="correo"
                    type="email"
                    value={finalFormData.correo || ''}
                    onChange={handleFinalFormChange}
                    required
                />
                <InputField
                    label="Sucursal"
                    name="sucursal"
                    value={finalFormData.sucursal || ''}
                    onChange={handleFinalFormChange}
                />
                <InputField
                    label="Fecha Aproximada de Cierre"
                    name="fecha_aprox_cierre"
                    type="date"
                    value={finalFormData.fecha_aprox_cierre || ''}
                    onChange={handleFinalFormChange}
                />

            </>
        );

        switch (outcomeType) {
            case VisitType.PROSPECTO:
                return (
                    <>
                        {commonFields}
                        <InputField
                            label="Ciudad"
                            name="ciudad"
                            value={finalFormData.ciudad || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                        <InputField
                            label="Sector / Actividad"
                            name="sector"
                            value={finalFormData.sector || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                        <TextAreaField
                            label="Compromisos"
                            name="compromisos"
                            value={finalFormData.compromisos || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                        <TextAreaField
                            label="Observaciones"
                            name="observaciones"
                            value={finalFormData.observaciones || ''}
                            onChange={handleFinalFormChange}
                        />
                    </>
                );
            case VisitType.MANTENIMIENTO:
                return (
                    <>
                        {commonFields}
                        <TextAreaField
                            label="Motivo / Tema Tratado (Observaciones)"
                            name="observaciones"
                            value={finalFormData.observaciones || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                    </>
                );
            case VisitType.CIERRE:
                return (
                    <>
                        {commonFields}
                        <InputField
                            label="Ciudad"
                            name="ciudad"
                            value={finalFormData.ciudad || ''}
                            onChange={handleFinalFormChange}
                        />
                        <SelectField
                            label="Tipo de Cierre"
                            name="tipo_cierre"
                            options={['nuevo', 'renovacion']}
                            value={finalFormData.tipo_cierre || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                        <InputField
                            label="Valor del Cierre"
                            name="valor"
                            type="number"
                            value={finalFormData.valor || ''}
                            onChange={handleFinalFormChange}
                            required
                        />
                        <TextAreaField
                            label="Compromisos"
                            name="compromisos"
                            value={finalFormData.compromisos || ''}
                            onChange={handleFinalFormChange}
                        />
                        <TextAreaField
                            label="Observaciones"
                            name="observaciones"
                            value={finalFormData.observaciones || ''}
                            onChange={handleFinalFormChange}
                        />
                    </>
                );
            default:
                return null;
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

    if (showError) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <i className="fas fa-times-circle text-5xl text-red-500 mb-4"></i>
                <h3 className="text-2xl font-bold text-gray-800">¡Error al guardar!</h3>
                <p className="text-gray-600 mt-2">{errorMessage}</p>
            </div>
        );
    }

    if (!activeVisit) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Iniciar Visita</h2>
                <p className="text-gray-600 mb-6">
                    Completa los datos del cliente para iniciar el cronómetro de la visita.
                </p>
                <form onSubmit={handleStartVisit} className="space-y-6">
                    <InputField
                        label="Nombre Cliente / Empresa"
                        name="clientName"
                        value={startFormData.clientName}
                        onChange={handleStartFormChange}
                        required
                    />
                    <InputField
                        label="NIT del Cliente"
                        name="clientNit"
                        value={startFormData.clientNit}
                        onChange={handleStartFormChange}
                        required
                    />
                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-gle-red text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition duration-300 flex items-center justify-center space-x-2 text-lg"
                        >
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
            <h2 className="text-3xl font-bold text-gle-red mb-6">
                Registrar Resultado de Visita a: {activeVisit.clientName}
            </h2>
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
                    <button
                        type="submit"
                        className="bg-gle-red text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 transition duration-300 flex items-center space-x-2 disabled:bg-gray-400"
                        disabled={locationStatus !== 'success'}
                    >
                        <i className="fas fa-save"></i>
                        <span>Guardar Registro Final</span>
                    </button>
                </div>
            </form>
        </div>
    );
};

const InputField = ({
    label,
    name,
    type = 'text',
    onChange,
    required = false,
    value = '',
}: {
    label: string;
    name: string;
    type?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    value?: string;
}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && ' *'}
        </label>
        <input
            type={type}
            id={name}
            name={name}
            onChange={onChange}
            required={required}
            value={value}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent"
        />
    </div>
);

const TextAreaField = ({
    label,
    name,
    onChange,
    required = false,
    value = '',
}: {
    label: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    required?: boolean;
    value?: string;
}) => (
    <div className="md:col-span-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && ' *'}
        </label>
        <textarea
            id={name}
            name={name}
            rows={4}
            onChange={onChange}
            required={required}
            value={value}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent"
        ></textarea>
    </div>
);

const SelectField = ({
    label,
    name,
    options,
    onChange,
    required = false,
    value = '',
}: {
    label: string;
    name: string;
    options: string[];
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    required?: boolean;
    value?: string;
}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && ' *'}
        </label>
        <select
            id={name}
            name={name}
            onChange={onChange}
            required={required}
            value={value}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent bg-white text-gray-900"
        >
            <option value="">Seleccione...</option>
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    </div>
);

export default RegistrationForm;
