import React from 'react';
import { GetServerSideProps } from 'next'
import Grid from '@mui/material/Grid';
import Layout from '../components/layout';
import StartSection from '../components/start-page';
import { loadMiscReduxState, ssrToLogin } from '../components/functions';

export const getServerSideProps: GetServerSideProps = async ({res,req:{cookies,url}}) => {
    /*if (cookies.hasOwnProperty('sid')){
        try {
            const 
                response = await fetch(`${process.env.NEXT_PUBLIC_SSR_API_URL}/start/prerender/`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        sMethod:'body',
                        sid:cookies.sid
                    },
                }),
                json = await response.json()

            if (!json.session){
                res.setHeader('Set-Cookie', [`sid=${cookies.sid}; expires=${new Date(Date.now() - 100000).toUTCString()}; path=/; httponly`]);
                return {redirect:{destination:ssrToLogin(url),permanent:false}}
            } else {
                res.setHeader('Set-Cookie', [`sid=${json.session.sid}; expires=${new Date(json.session.expires).toUTCString()}; path=/; httponly`]);
                if (json.data.systemStarted) return {redirect:{destination:'/',permanent:false}}
            }
        } catch (error) {
            res.setHeader('Set-Cookie', [`sid=${cookies.sid}; expires=${new Date(Date.now() - 100000).toUTCString()}; path=/; httponly`]);
            return {redirect:{destination:ssrToLogin(url),permanent:false}}
        }
    } else {
        return {redirect:{destination:ssrToLogin(url),permanent:false}}
    }*/
    
    return {
        props:{
            preloadedState:{
                misc:{...loadMiscReduxState(true,'')}
            }
        }
    }
}

const SystemStart = () => (
    <Layout>
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <StartSection />
            </Grid>
        </Grid>
    </Layout>
)

export default SystemStart;