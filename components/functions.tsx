import { AppDispatch } from '@reducers';
import { createEntityAdapter, EntityId, EntityState } from '@reduxjs/toolkit';
import { NextRouter } from '../node_modules/next/router';
import { initialState as miscInitialState, sessionRenewTime } from '../reducers/misc';
import { FileDraft } from './interfaces';

const 
    capitalizeSingleWord = (e:string) => `${e[0].toUpperCase()}${e.slice(1)}`,
    pushToLogin = (router:NextRouter) => router.push(`/login?redirect=${router.asPath}`),
    getSession = () => new Promise<boolean>((resolve,reject)=>fetch(
        '/api/update-session',{
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                sMethod:'ck',
            },
            credentials:'include'
        }
    )
    .then(res=>res.json())
    .then(json=>{
        resolve(!!json?.data?.success)
    })
    .catch(err=>{
        reject(err)
    })),
    updateSession = async(router:NextRouter,dispatch: AppDispatch) => {
        try {
            const
                start = Date.now(),
                success = await getSession()
            if (success) dispatch(sessionRenewTime(start))
            else pushToLogin(router)
        } catch (error) {
            console.log(error)
        }
    },
    numberToInterval = (e:number) => {
        const 
            h = Math.floor(e/3600000),
            m = Math.floor((e/60000) % 60),
            s = Math.round((e/1000) % 60)
        return `${!!h ? `${h}h ` : ''}${!!m ? `${m}m ` : ''}${s}s`
    },
    getFiledataPromise = (blob: Blob) => new Promise((resolve,reject)=>{
        var fr = new FileReader();  
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsText(blob);
    }),
    getFileArrayBufferPromise = (blob: Blob) => new Promise((resolve,reject)=>{
        var fr = new FileReader();  
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsArrayBuffer(blob);
    }),
    getImageFromURL = (url:string) => new Promise<HTMLImageElement>((resolve,reject)=>{
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = url;
    }),
    loadBooleanCookies = (cookieName:string, cookies:any):boolean|null => {
        let result = null
        if (cookies.hasOwnProperty(cookieName)) result = cookies[cookieName] === 'true'
        return result
    },
    loadMiscReduxState = (authRequired:boolean,uid:EntityId) => ({
        ...miscInitialState,
        authRequired,
        signedIn:authRequired,
        uid
    }),
    ssrToLogin = (url:string) => `/login?redirect=${url}`,
    second = 1000,
    minute = second * 60,
    hour = minute * 60,
    day = hour * 24,
    week = day * 7,
    year = day * 365.25,
    timeFrames = {
        year,
        week,
        day,
        hour,
        minute
    },
    getTimeInterval = (diff:number) => {
        const 
            pairs = Object.entries(timeFrames),
            len = pairs.length

        for (let i=0; i<len; i++){
            const p = pairs[i]
            if (diff > p[1]) return `${Math.floor(diff / p[1])}${p[0][0]}`
        }
        return '<1m'
    },
    getClosestNextStepMS = (diff:number) => {
        const 
            steps = Object.values(timeFrames),
            len = steps.length

        for (let i=0; i<len; i++){
            const s = steps[i]
            if (diff > s) return s
        }
        return steps[steps.length-1]
    },
    units = ['bytes','KB','MB','GB','TB'],
    unitLen = units.length,
    getFileSizeString = (sizeInByte:number) => {
        let size = '', unit = ''

        for (let i=0; i<unitLen; i++){
            if (sizeInByte < Math.pow(1024,i+1)){
                size = i===0 ? (sizeInByte % Math.pow(1024,i+1)).toString() : (sizeInByte / Math.pow(1024,i)).toFixed(2)
                unit = units[i]
                break
            }
        }

        if (unit==='bytes' && ['0','1'].includes(size)) unit = 'byte'
        return `${size} ${unit}`
    },
    fileInputAdapter = createEntityAdapter<FileDraft>(),
    fileInputSelector = fileInputAdapter.getSelectors((file:EntityState<FileDraft>)=>file),
    timerIntervalToString = (interval:number) => {
        const d = new Date(interval)
        return `${Math.floor(interval / 3600000)} : ${d.getMinutes().toString().padStart(2,'0')} : ${d.getSeconds().toString().padStart(2,'0')}`
    },
    interpolateColorSubstring = (zero:string,one:string,i:number,start:number,end:number) => {
        return Math.round((parseInt(one.substring(start,end),16) - parseInt(zero.substring(start,end),16)) * i + parseInt(zero.substring(start,end),16)).toString(16)
    },
    interpolateColorString = (zero:string,one:string,i:number) => {
        const j = i / 100
        return `#${interpolateColorSubstring(zero,one,j,1,3)}${interpolateColorSubstring(zero,one,j,3,5)}${interpolateColorSubstring(zero,one,j,5,7)}`
    },
    enterIsPressed = (e:KeyboardEvent) => e.key==='Enter' && !e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey

export {
    capitalizeSingleWord,
    updateSession,
    pushToLogin,
    getFiledataPromise,
    getFileArrayBufferPromise,
    loadBooleanCookies,
    loadMiscReduxState,
    ssrToLogin,
    getTimeInterval,
    getClosestNextStepMS,
    getFileSizeString,
    fileInputAdapter,
    fileInputSelector,
    timerIntervalToString,
    interpolateColorString,
    enterIsPressed,
    getImageFromURL,
    numberToInterval,
}