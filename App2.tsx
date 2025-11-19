import React, { useState } from 'react';
import './index.css'
import Map from './components/map';

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
        <Map />
        </>
    )
}

export default App