import { GoogleFilePrelim } from "./slice";

let 
    accessToken = '',
    tokenExpiry = 0,
    tasks:{[k:string]:GoogleFilePrelim} = {}

export interface IncomingMessage {
    data:{
        type:string;
        files:GoogleFilePrelim[];
    }
}

const
    privateDirID = '1Sd1ibSGC1bpLa4Ru3WDU8sejY20qcrfr',
    publicDirID = '1AxLtuuIXzYR3u7aqqZlPsn9VX6JqjzWL',
    updateAccessToken = async() => {
        const 
            response = await fetch('/api/googleservice/get-access-token'),
            json = await response.json()
        accessToken = json.accessToken
        tokenExpiry = json.expiry
    },
    deleteTask = (id:string) => {
        URL.revokeObjectURL(tasks[id].dataUrl)
        delete tasks[id]
    },
    handleError = (id:string) => {
        tasks[id].error = true
        self.postMessage(tasks[id])
        deleteTask(id)
    },
    getArrayBuffer = async(id:string) => {
        const 
            fileObj = tasks[id],
            file = await fetch(fileObj.dataUrl)    
            
        if (!file.ok){
            handleError(id)
            return null
        }
        const fileArrayBuffer = await file.arrayBuffer()
        return fileArrayBuffer
    },
    startRequest = async(id:string,lastBit:number) => {
        const fileArrayBuffer = await getArrayBuffer(id)
        if (!fileArrayBuffer) return

        const xhr = new XMLHttpRequest()
        xhr.open('PUT',tasks[id].uploadEndpoint)
        xhr.responseType = 'json'

        xhr.setRequestHeader('Authorization',`Bearer ${accessToken}`)
        if (lastBit !== -1) xhr.setRequestHeader('Content-Range',`bytes ${lastBit+1}-${tasks[id].fileSize-1}/${tasks[id].fileSize}`)

        xhr.upload.onprogress = (ev: ProgressEvent<EventTarget>) => {
            if (lastBit !== -1) tasks[id].uploaded = ev.loaded + lastBit
            else tasks[id].uploaded = ev.loaded
            if (tasks[id].error) tasks[id].error = false
            self.postMessage(tasks[id])
        }
        xhr.onerror = () => {
            tasks[id].uploading = false
            tasks[id].error = true
            self.postMessage(tasks[id])
        }
        xhr.onload = () => {
            tasks[id].googleFileID = xhr.response.id
            self.postMessage(tasks[id])
            deleteTask(id)
        }
        tasks[id].uploading = true
        if (lastBit !== -1) xhr.send(fileArrayBuffer.slice(lastBit+1))
        else xhr.send(fileArrayBuffer)
    },
    uploadNewFile = async(id:string) => {
        const 
            uploadRequest = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',{
                method:'POST',
                headers:{
                    'Authorization':`Bearer ${accessToken}`,
                    'Content-Type':'application/json;charset=UTF-8',
                    'X-Upload-Content-Length':tasks[id].fileSize.toString(),    
                    'Content-Length':tasks[id].fileSize.toString()
                },
                body:JSON.stringify({
                    name:tasks[id].fileName,
                    mimeType:tasks[id].mimeType,
                    parents:tasks[id].folder==='private' ? [privateDirID] : [publicDirID]
                })
            })
        tasks[id].uploadEndpoint = uploadRequest.headers.get('location')
        startRequest(id,-1)
    },
    uploadNewFiles = async(files:GoogleFilePrelim[]) => {
        if (tokenExpiry < Date.now()) await updateAccessToken()
        const len = files.length

        for (let i=0; i<len; i++){
            const file = files[i]
            tasks[file.id] = file
            uploadNewFile(file.id as string)
        }
    },
    resumeUpload = async(id:string) => {
        if (tasks[id].uploading) return
        if (tasks[id].uploadEndpoint==='') {
            uploadNewFile(id)
            return
        }

        if (tokenExpiry < Date.now()) await updateAccessToken()

        const initialRequest = await fetch(tasks[id].uploadEndpoint,{
            method:'PUT',
            headers:{
                'Content-Range':`bytes */${tasks[id].fileSize}`,
                'Authorization':`Bearer ${accessToken}`,
            }
        })

        if ([200,201].includes(initialRequest.status)){
            deleteTask(id)
            return
        } else if (initialRequest.status===404) {
            uploadNewFile(id)
            return
        }

        const range = initialRequest.headers.get('range')
        if (!range){
            uploadNewFile(id)
            return
        }
        const lastBit = +range.replace('bytes=0-','')
        if (isNaN(lastBit)) {
            handleError(id)
            return
        }

        startRequest(id,lastBit)
    },
    resumeAllUpload = async() => {
        if (tokenExpiry < Date.now()) await updateAccessToken()
        const 
            ids = Object.keys(tasks),
            len = ids.length

        for (let i=0; i<len; i++){
            resumeUpload(ids[i])
        }
    }

self.onmessage = ({ data: { type,files } }:IncomingMessage) => {
    switch(type){
        case 'new-files':
            uploadNewFiles(files);
            break;
        case 'resume-all':
            resumeAllUpload();
            break;
        default:
            if (tasks.hasOwnProperty(type)) resumeUpload(type);
            break;
    }
};

export {}