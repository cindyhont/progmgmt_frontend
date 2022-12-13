import React, { useEffect } from "react";
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
    let 
        result:any = null
        // link = process.env.SSR_API_URL;
        // link = process.env.NEXT_PUBLIC_SSR_API_URL;
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
        return {props:{
            result,
            // link
        }}
    }

    return {props:{
        result,
        // link
    }}
}

const Testpage = (
    {
        result,
        // link
    }:{
        result:any;
        // link:string;
    }
) => {
    useEffect(()=>console.log('result:',result),[result])
    // useEffect(()=>console.log('link:',link),[link])

    return (
        <>
        <pre>{JSON.stringify(result)}</pre>
        
        </>
    )
}

export default Testpage