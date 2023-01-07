import React, { useEffect } from 'react';
import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({req:{headers:{host}}}) => {
    return {
        props:{
            host
        }
    }
}

const TestPage = ({host}:{host:string}) => {
    useEffect(()=>console.log(host),[])
    return <></>
}

export default TestPage