import { EntityId, Update } from "@reduxjs/toolkit";

class IndexedDB {
    dbName:string;
    dbVersion:number;
    stores: {
        storeName: 'taskFields';
        keyPath: string;
        indice: {
            name: string;
            unique: boolean;
        }[];
    }[];
    storeNames:{taskFields:string};
    constructor(dbName:string,dbVersion:number){
        this.dbName = dbName;
        this.dbVersion = dbVersion;
        this.stores = [
            {
                storeName:'taskFields',
                keyPath:'id',
                indice:['listWideScreenOrder','listNarrowScreenOrder','detailsSidebarOrder','detailsSidebarExpand'].map(e=>({name:e,unique:false}))
            }
        ]
        this.storeNames = this.stores.map(e=>({[e.storeName]:e.storeName})).reduce((a,b)=>({...a,...b}))
    }

    setupDB = ():Promise<boolean> => new Promise(resolve=>{
        if (!indexedDB) {
            resolve(false)
            return
        }

        const request = indexedDB.open(this.dbName, this.dbVersion)
        request.onerror = () => resolve(false)

        request.onsuccess = () => resolve(true)

        request.onupgradeneeded = (e:any) => {
            const db:IDBDatabase = e.target.result
            db.onerror = (e:Event) => {
                console.log(e)
                resolve(false)
            }
            
            this.stores.forEach(({storeName,keyPath,indice})=>{
                const objStore = db.createObjectStore(storeName,{keyPath})
                indice.forEach(({name,unique})=>{
                    objStore.createIndex(name,name,{unique})
                })
            })
        }

        request.onblocked = () => resolve(true)
    })

    getAll = (storeName:string):Promise<any[]> => new Promise(resolve=>{
        if (!indexedDB) {
            resolve([])
            return
        }

        const request = indexedDB.open(this.dbName, this.dbVersion)
        request.onerror = () => resolve([])

        request.onsuccess = () => {
            const 
                db = request.result,
                objStore = db.transaction(storeName,'readonly').objectStore(storeName),
                req = objStore.getAll()

            req.onsuccess = () => resolve(req.result)
            req.onerror = () => resolve([])
        }
    })

    updateMultipleEntries = (storeName:string,updates:Update<any>[],deleteID?:EntityId):Promise<boolean> => new Promise(resolve=>{
        if (!indexedDB) {
            resolve(false)
            return
        }

        const request = indexedDB.open(this.dbName, this.dbVersion)
        request.onerror = () => resolve(false)

        request.onsuccess = () => {
            const 
                db = request.result,
                objStore = db.transaction(storeName,'readwrite').objectStore(storeName),
                cursorRequest = objStore.openCursor()

            cursorRequest.onsuccess = () => {
                const cursor = cursorRequest.result
                if (cursor){
                    if (!!deleteID && cursor.value.id===deleteID) cursor.delete()
                    else {
                        const update = updates.find(e=>e.id===cursor.value.id)
                        if (!!update){
                            const 
                                updateData = cursor.value,
                                {changes} = update,
                                entries = Object.entries(changes),
                                len = entries.length

                            for (let i=0; i<len; i++){
                                const entry = entries[i]
                                updateData[entry[0]] = entry[1]
                            }
                            cursor.update(updateData)
                        }
                    }
                    cursor.continue()
                } else {
                    resolve(true)
                }
            }

            cursorRequest.onerror = () => resolve(false)
        }
    })

    addMulitpleEntries = (storeName:string,arr:any[]):Promise<boolean> => new Promise(resolve=>{
        if (!indexedDB) {
            resolve(false)
            return
        }

        const request = indexedDB.open(this.dbName, this.dbVersion)
        request.onerror = () => resolve(false)

        request.onsuccess = () => {
            const 
                db = request.result,
                objStore = db.transaction(storeName,'readwrite').objectStore(storeName)

            arr.forEach(obj=>{
                objStore.add(obj)
            })
            resolve(true)
        }
    })

    replaceAllInMultipleStores = (obj:{[storeName:string]:any[]}): Promise<boolean> => new Promise(resolve=>{
        if (!indexedDB) {
            resolve(false)
            return
        }

        const request = indexedDB.open(this.dbName, this.dbVersion)
        request.onerror = () => resolve(false)

        request.onsuccess = () => {
            const 
                db = request.result,
                objs = Object.entries(obj)

            objs.forEach(([storeName,arr]:[string,any[]])=>{
                const objStore = db.transaction(storeName,'readwrite').objectStore(storeName)
                objStore.clear()
                arr.forEach(e=>{
                    objStore.add(e)
                })
            })
            resolve(true)
        }
    })
}

export default IndexedDB