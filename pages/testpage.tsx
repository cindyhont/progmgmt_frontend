import React, { useEffect } from "react";
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
    let result:any = null;
    try {
        const 
            response = await fetch(`${process.env.SSR_API_URL}/`, {
                method: 'GET',
                headers: { 
                    'Content-Type': 'application/json',
                },
            })
            result = await response.json()
    } catch (error) {
        return {props:{result}}
    }

    return {props:{result}}
}

const Testpage = ({result}:{result:any}) => {
    useEffect(()=>console.log(result),[result])

    return <pre>{result}</pre>
}

export default Testpage