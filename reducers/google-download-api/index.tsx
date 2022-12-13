import apiSlice from "../api";
import { gFilesUpsertOne, GoogleFile } from "./slice";

let 
    worker:Worker = null,
    tasks:{[k:string]:boolean} = {}

const 
    googleDownloadApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            newGoogleDownload:build.mutation<any,GoogleFile>({
                async queryFn(file,{dispatch}){
                    dispatch(gFilesUpsertOne(file))
                    if (!!worker) {
                        tasks[file.id] = true
                        worker.postMessage({type:'new-file',file})
                    }
                    return {data:null}
                }
            }),
            initGoogleDownload:build.query<any,void>({
                queryFn: () => ({ data: [] }),
                keepUnusedDataFor:0,
                async onCacheEntryAdded(_,{dispatch,cacheDataLoaded, cacheEntryRemoved}){
                    const listener = (e:MessageEvent) => {
                        const file = e.data as GoogleFile
                        if (file.url !== ''){
                            const a = document.createElement('a')
                            a.href = file.url
                            a.download = file.name
                            a.click()
                            a.remove()
                            URL.revokeObjectURL(file.url)

                            dispatch(gFilesUpsertOne({...file,url:''}))
                        } else dispatch(gFilesUpsertOne(file))

                        if (!file.downloading) delete tasks[file.id]
                    }
                    try {
                        await cacheDataLoaded;
                        
                        if (!worker){
                            worker = new Worker(new URL('./worker.ts',import.meta.url));
                            
                            worker.addEventListener('message',listener)
                            worker.addEventListener('error',()=>console.log('downloader error'))
                            worker.addEventListener('messageerror',()=>console.log('downloader message error'))
                        }
                    } catch {}
                    await cacheEntryRemoved
                    worker.removeEventListener('message',listener)
                    worker = null
                },
            })
        })
    })

export const {
    useNewGoogleDownloadMutation,
} = googleDownloadApi
export default googleDownloadApi