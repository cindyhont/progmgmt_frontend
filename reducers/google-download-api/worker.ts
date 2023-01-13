import { GoogleFile } from "./slice";

let 
    accessToken = '',
    tokenExpiry = 0

export interface IncomingMessage {
    data:{
        type:string;
        file:GoogleFile;
    }
}

const
    updateAccessToken = async() => {
        const 
            response = await fetch('/pm-api/googleservice/get-access-token'),
            json = await response.json()
        accessToken = json.accessToken
        tokenExpiry = json.expiry
    },
    newDownloadTask = async(file:GoogleFile) => {
        if (tokenExpiry < Date.now()) await updateAccessToken()

        file.progress = 0
        file.error = false
        file.downloading = true
        self.postMessage(file)

        const xhr = new XMLHttpRequest()
        xhr.open('GET',`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`)
        xhr.setRequestHeader('Authorization',`Bearer ${accessToken}`)
        xhr.responseType = 'blob'
        xhr.onprogress = (ev: ProgressEvent<EventTarget>) => {
            file.progress = ev.loaded
            file.downloading = true
            file.error = false
            self.postMessage(file)
        }
        xhr.onerror = () => {
            file.downloading = false
            file.error = true
            self.postMessage(file)
        }
        xhr.onload = () => {
            file.progress = 0
            file.downloading = false
            file.error = true
            file.url = URL.createObjectURL(xhr.response)
            self.postMessage(file)
        }
        
        xhr.send()
    }

self.onmessage = ({data:{type,file}}:IncomingMessage) => {
    switch (type){
        case 'new-file':
            newDownloadTask(file)
            break
    }
}

export {}