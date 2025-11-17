
import React, { useState, useEffect } from 'react';

interface ClientData {
    nombre: string;
    nit: string;
    direccion: string;
    contacto: string;
    telefono: string;
    correo: string;
}

interface ClientEditModalProps {
    clientData: ClientData;
    onClose: () => void;
    onSave: (updatedData: Omit<ClientData, 'nit'>) => void;
}

const InputField = ({ label, name, value, onChange }: { label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input 
            type="text" 
            id={name} 
            name={name} 
            value={value}
            onChange={onChange}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-gle-red focus:border-transparent" 
        />
    </div>
);

const ClientEditModal: React.FC<ClientEditModalProps> = ({ clientData, onClose, onSave }) => {
    const [formData, setFormData] = useState<Omit<ClientData, 'nit'>>({
        nombre: '',
        direccion: '',
        contacto: '',
        telefono: '',
        correo: '',
    });

    useEffect(() => {
        if (clientData) {
            setFormData({
                nombre: clientData.nombre,
                direccion: clientData.direccion,
                contacto: clientData.contacto,
                telefono: clientData.telefono,
                correo: clientData.correo,
            });
        }
    }, [clientData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl transform transition-all">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                    <h2 className="text-2xl font-bold text-gle-gray-dark">Editar Información del Cliente</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 text-3xl font-light">
                        &times;
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIT</label>
                        <p className="w-full p-3 bg-gray-100 border border-gray-200 rounded-md text-gray-600">{clientData.nit}</p>
                    </div>

                    <InputField label="Nombre Cliente / Empresa" name="nombre" value={formData.nombre} onChange={handleChange} />
                    <InputField label="Dirección" name="direccion" value={formData.direccion} onChange={handleChange} />
                    <InputField label="Persona de Contacto" name="contacto" value={formData.contacto} onChange={handleChange} />
                    <InputField label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} />
                    <InputField label="Correo Electrónico" name="correo" value={formData.correo} onChange={handleChange} />

                    <div className="flex justify-end pt-6 space-x-4">
                        <button 
                            type="button"
                            onClick={onClose}
                            className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition duration-300"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="bg-gle-red text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition duration-300"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientEditModal;
