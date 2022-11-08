import chatApi from "@components/chat/reducers/api";
import taskApi from "@components/tasks/reducers/api";
import { gFilesUpsertOne } from "@reducers/google-download-api/slice";
import apiSlice from "../api";
import { addFiles, GoogleFilePrelim, upsertOneFile } from "./slice";

let 
    worker:Worker = null,
    tasks:{[k:string]:boolean} = {}

const 
    googleUploadApi = apiSlice.injectEndpoints({
        endpoints:(build) => ({
            addNewGoogleFiles:build.mutation<any,GoogleFilePrelim[]>({
                async queryFn(files,{dispatch}){
                    dispatch(addFiles(files))
                    
                    if (!!worker) {
                        const len = files.length
                        for (let i=0; i<len; i++){
                            tasks[files[i].id] = true
                        }
                        worker.postMessage({
                            type:'new-files',
                            files
                        })
                    }
                    return {data:null}
                }
            }),
            resumeAllUploads:build.mutation<any,void>({
                queryFn(){
                    if (!!worker) worker.postMessage({
                        type:'resume-all'
                    })
                    return {data:null}
                }
            }),
            initGoogleUpload:build.query<any,void>({
                queryFn: () => ({ data: [] }),
                keepUnusedDataFor:0,
                async onCacheEntryAdded(_,{dispatch,cacheDataLoaded, cacheEntryRemoved}){
                    const listener = (e:MessageEvent) => {
                        const file = e.data as GoogleFilePrelim

                        dispatch(upsertOneFile(file))
                        
                        if (file.googleFileID !== '') {
                            dispatch(gFilesUpsertOne({
                                id:file.googleFileID,
                                name:file.fileName,
                                size:file.fileSize,
                                downloading:false,
                                progress:0,
                                url:'',
                                error:false,
                            }))
                            if (file.parentType==='chat') dispatch(chatApi.endpoints.chatAttachmentUploaded.initiate(file.id))
                            else if (file.parentType==='task') dispatch(taskApi.endpoints.taskAttachmentUploaded.initiate(file.id))
                        }
                        if (file.googleFileID !== '' || file.error) delete tasks[file.id]
                    }
                    try {
                        await cacheDataLoaded;
                        
                        if (!worker){
                            worker = new Worker(new URL('./worker.ts',import.meta.url));
                            
                            worker.addEventListener('message',listener)
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
    useResumeAllUploadsMutation
} = googleUploadApi
export default googleUploadApi