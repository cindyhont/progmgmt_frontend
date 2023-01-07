import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
    // let links:any = null
    let resultA:any = null
    let resultB:any = null
    try {
        /*
        const 
            testLink = (url:string) => new Promise<any>(resolve=>{
                fetch(url,{
                    headers: { 
                        'Content-Type': 'application/json',
                    },
                })
                .then(res=>{
                    res.json()
                })
                .then(r=>resolve(r))
                .catch(e=>resolve(e))
            })
        links = await Promise.all([
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_A),
            testLink(process.env.NEXT_PUBLIC_SSR_API_URL_B),
        ])
        */

        const responseA = await fetch(process.env.NEXT_PUBLIC_SSR_API_URL_A, {
            headers: { 
                'Content-Type': 'application/json',
            },
        })
        resultA = await responseA.json()

        const responseB = await fetch(process.env.NEXT_PUBLIC_SSR_API_URL_B, {
            headers: { 
                'Content-Type': 'application/json',
            },
        })
        resultB = await responseB.json()
    } catch {}

    return {
        props:{
            apiA:process.env.NEXT_PUBLIC_SSR_API_URL_A,
            apiB:process.env.NEXT_PUBLIC_SSR_API_URL_B,
            // links,
            resultA,
            resultB,
        }
    }
}

const TestPage = ({apiA,apiB,resultA,resultB}:{apiA:string;apiB:string;resultA:any;resultB:any;}) => {
    useEffect(()=>{
        console.log(apiA)
        console.log(apiB)
        console.log(resultA)
        console.log(resultB)
    },[])
    return <></>
}

export default TestPage