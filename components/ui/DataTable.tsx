import React from 'react';

interface DataTableProps {
    title: string;
    data: any[];
    columns: {
        key: string;
        name: string;
        render?: (item: any) => React.ReactNode;
    }[];
}

const DataTable: React.FC<DataTableProps> = ({ title, data, columns }) => {
    if (!data) return <p>No data available</p>;
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold mb-4">{title}</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map(col => <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{col.name}</th>)}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                         {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="text-center py-4">No hay registros para mostrar.</td>
                            </tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={item.id || index}>
                                    {columns.map(col => (
                                        <td key={`${item.id}-${col.key}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
