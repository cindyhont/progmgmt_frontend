import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

const 
    testLink = (url:string) => new Promise<any>(resolve=>{
        fetch(url)
        .then(res=>{
            res.json()
        })
        .then(r=>resolve(r))
        .catch(e=>resolve(e))
    })

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    let links:any = null
    try {
        links = await Promise.all([
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_A),
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_B),
        ])
    } catch {}

    return {
        props:{
            headers:req.headers,
            apiA:process.env.NEXT_PUBLIC_SSR_API_URL_A,
            apiB:process.env.NEXT_PUBLIC_SSR_API_URL_B,
            links
        }
    }
}

const TestPage = ({headers,apiA,apiB,links}:{headers:any;apiA:string;apiB:string;links:any}) => {
    useEffect(()=>{
        console.log(headers)
        console.log(apiA)
        console.log(apiB)
        console.log(links)
    },[])
    return <></>
}

export default TestPage