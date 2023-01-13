import apiSlice, { fetchConfig } from "@reducers/api";
import { TaskEdit } from "../dialogs/add-edit-task/reducer";
import { Task, TaskComment, TaskField, TaskRecord, TaskTimeRecord } from "../interfaces";
import { v4 as uuidv4 } from 'uuid'
import { ReduxState } from "@reducers";
import { 
    addCustomField, 
    addManyParentChildTask, 
    addTaskRecord, 
    deleteTask, 
    editCustomField, 
    newTaskFetched, 
    taskAddComment, 
    taskAddOne, 
    taskBulkUpdate, 
    taskCommentSelector, 
    taskDeleteBoardColumn, 
    taskDeleteComment, 
    taskDeleteCustomField, 
    taskEditComment, 
    taskEndTimer, 
    taskFieldSelector, 
    taskSelector, 
    taskStartTimer, 
    taskTimeRecordsSelector, 
    taskUpdateOne, 
} from "./slice";
import { FileDraft } from "@components/interfaces";
import { EntityId, Update } from "@reduxjs/toolkit";
import googleUploadApi from "@reducers/google-upload-api";
import { googleFilePrelimSelector } from "@reducers/google-upload-api/slice";
import { isSignedOut, sessionRenewTime } from "@reducers/misc";
import { IcustomField } from "../dialogs/custom-field/reducer";
import websocketApi from "websocket/api";
import { gFilesUpsertMany, googleFileSelector } from "@reducers/google-download-api/slice";
import { addUserDetailsStatusUnknown } from "@reducers/user-details/slice";
import { Ioption as IboardColumn } from "../board";

const
    PATH = '/pm-api',
    getBlobUrlFromText = async(text:string,fieldID:EntityId) => {
        const 
            parser = new DOMParser(),
            doc = parser.parseFromString(text,'text/html'),
            imageTags = doc.getElementsByTagName('img'),
            imageArr = Array.from(imageTags),
            len = imageArr.length

        let fileDraft:FileDraft[] = []

        for (let i=0; i<len; i++){
            if (!imageArr[i].src.startsWith('data:') && !imageArr[i].src.startsWith('blob:')) continue

            try {
                const
                    response = await fetch(imageArr[i].src),
                    blob = await response.blob(),
                    thisID = uuidv4(),
                    url = imageArr[i].src.startsWith('blob:') ? imageArr[i].src : URL.createObjectURL(blob)

                imageArr[i].src = url
                    
                fileDraft.push({
                    id:thisID,
                    name:thisID,
                    size:blob.size,
                    folder:'public' as 'public',
                    url,
                    mimeType:!!blob.text ? blob.type : '*/*',
                    parentID:fieldID
                })
            } catch (error) {
                imageTags.item(i).remove()
            }
        }

        return {files:fileDraft,finalString:doc.body.innerHTML,fieldID}
    },
    getExtraFieldKeys = (state:ReduxState) => taskFieldSelector.selectAll(state).filter(e=>!!e.details).map(e=>e.id),
    getExtraFieldFromTask = (state:ReduxState,t:Task) => {
        const extraFieldKeys = getExtraFieldKeys(state)
        return Object.entries(t).filter(p=>extraFieldKeys.includes(p[0])).map(p=>({[p[0]]:p[1]})).reduce((a,b)=>({...a,...b}))
    },
    objArrToObj = (arr:{[k:string]:any}[]) => {
        const len = arr.length
        return !len ? {} : len===1 ? arr[0] : arr.reduce((a,b)=>({...a,...b}))
    },
    getExtraFieldObjFromTaskEdit = (state:ReduxState,t:{[k:string]:any}) => {
        const extraFieldKeys = getExtraFieldKeys(state)
        return Object.entries(t)
            .filter(p=>extraFieldKeys.includes(p[0]))
            .map(p=>{
                const 
                    fieldID = p[0],
                    fieldType = taskFieldSelector.selectById(state,fieldID).fieldType //taskCustomFieldTypesSelector.selectById(state,taskCustomFieldSelector.selectById(state,fieldName).fieldTypeID).fieldType
                if (fieldType==='number') {
                    const v = t[`${fieldID}_edit`]
                    return {[fieldID]:!!v ? isNaN(+v) ? 0 : +v : 0}
                } else if (fieldType==='date'){
                    const v = t[`${fieldID}_edit`]
                    return {[fieldID]:!!v ? v.valueOf() : 0}
                } else return {[p[0]]:p[1]}
            })
            .reduce((a,b)=>({...a,...b}))
    },
    getCustomFieldDetails = (f:IcustomField) => {
        const 
            {fieldType} = f,
            options = f.options[fieldType] ?? []

        let defaultValue = null
        if (['short_text','board_column'].includes(fieldType.toString())) defaultValue = !!f.defaultValues[fieldType] ? f.defaultValues[fieldType].trim() : ''
        else if (fieldType==='date' && !!f.defaultValues[fieldType]) defaultValue = f.defaultValues[fieldType].valueOf()
        else if (fieldType==='number') defaultValue = !!f.defaultValues[fieldType] ? isNaN(+f.defaultValues[fieldType]) ? 0 : +f.defaultValues[fieldType] : 0
        else if (['people','tags'].includes(fieldType.toString())) defaultValue = f.defaultValues[fieldType] ?? []
        else if (fieldType==='link') defaultValue = f.defaultValues[fieldType] ?? {
            link:'',
            url:''
        }
        else if (fieldType==='dropdown' && !!f.defaultValues[fieldType]) defaultValue = f.defaultValues[fieldType]
        else if (fieldType==='checkbox') defaultValue = f.defaultValues[fieldType] ?? false
        else if (fieldType==='single_person' && !!f.defaultValues[fieldType]) defaultValue = f.defaultValues[fieldType]

        return {default:defaultValue,...(['tags','dropdown','board_column'].includes(fieldType.toString()) && {options})}
    },
    taskApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            searchTasks:build.mutation<{value:string;label:string;}[],{
                query:string;
                exclude:EntityId[];
            }>({
                async queryFn(arg,{dispatch,getState},_extra,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/tasks/search-tasks`,'POST',arg))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:[]}
                        } 
                        const 
                            tasks = result.data as Task[],
                            state = getState() as ReduxState,
                            allExistingTaskIDs = taskSelector.selectIds(state),
                            tasksInStore = tasks.filter(e=>allExistingTaskIDs.includes(e.id)),
                            tasksNotInStore = tasks.filter(e=>!allExistingTaskIDs.includes(e.id))

                        if (!!tasksInStore.length) dispatch(taskBulkUpdate(tasksInStore.map(e=>({
                            id:e.id,
                            changes:{
                                name:e.name,
                                parents:e.parents,
                                owner:e.owner
                            }
                        }))))

                        if (!!tasksNotInStore.length) dispatch(addManyParentChildTask(tasksNotInStore))

                        dispatch(sessionRenewTime(start))
                        return {data:tasks.map(e=>({
                            value:e.id.toString(),
                            label:e.name,
                        }))}
                    } catch {}
                    return {data:[]}
                },
            }),
            fetchParentChildTask:build.mutation<any,EntityId[]>({
                query:taskIDs => fetchConfig(`${PATH}/tasks/fetch-parent-child-tasks`,'POST',{taskIDs}),
                async onQueryStarted(_,{ dispatch, queryFulfilled }){
                    const start = Date.now()
                    try {
                        const {data} = await queryFulfilled as {data:Task[]}
                        if (!!data.length) dispatch(addManyParentChildTask(data))
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            fetchTask:build.mutation<any,EntityId>({
                query:(taskID) => fetchConfig(`${PATH}/tasks/fetch-task/${taskID}`,'GET'),
                async onQueryStarted(_,{dispatch,queryFulfilled}){
                    try {
                        const 
                            start = Date.now(),
                            {data} = await queryFulfilled,
                            {task,comments,timeRecords,users,files} = data as {
                                task:Task;
                                comments:TaskComment[];
                                timeRecords:TaskTimeRecord[];
                                users:{avatar:string;firstName:string;lastName:string;id:EntityId;}[];
                                files:{id:EntityId;name:string;size:number}[];
                            }

                        if (!!users.length) dispatch(addUserDetailsStatusUnknown(users))
                        if (!!files && !!files.length) dispatch(gFilesUpsertMany(files.map(f=>({
                            ...f,
                            downloading:false,
                            progress:0,
                            error:false,
                            url:'',
                        }))))
                        dispatch(newTaskFetched({task,comments,timeRecords}))
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            addTaskToDB:build.mutation<any,{
                taskID:EntityId;
                publicFileIDs:EntityId[];
                privateFileIDs:EntityId[];
            }>({
                async queryFn({taskID,publicFileIDs,privateFileIDs},{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        task = taskSelector.selectById(state,taskID),
                        extraFieldObj = getExtraFieldFromTask(state,task),
                        files = privateFileIDs.map(e=>{
                            const {id,name,size} = googleFileSelector.selectById(state,e)
                            return {id,name,size}
                        })

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/tasks/add-task`,'POST',{task,extraFieldObj,publicFileIDs,files}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {
                            success:boolean;
                            wsids:string[];
                            parents:EntityId[];
                            parent?:{
                                id:EntityId;
                                name:string;
                                owner:EntityId;
                                approval:number;
                            }
                        }
                        if (data.success){
                            dispatch(taskUpdateOne({id:taskID,changes:{sent:true,parents:data.parents}}))
                            if (!!data.parent) dispatch(taskUpdateOne({
                                id:data.parent.id,changes:{
                                    name:data.parent.name,
                                    owner:data.parent.owner,
                                    approval:data.parent.approval
                                }
                            }))
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({reqs:data.wsids}))
                        }
                        dispatch(sessionRenewTime(start))
                    } catch {}
                        
                    return {data:null}
                }
            }),
            updateCommentInDB:build.mutation<any,{
                commentID:EntityId;
                publicFileIDs:EntityId[];
                privateFileIDs:EntityId[];
            }>({
                async queryFn({commentID,publicFileIDs,privateFileIDs},{dispatch,getState},_,baseQuery){
                    const
                        state = getState() as ReduxState,
                        comment = taskCommentSelector.selectById(state,commentID),
                        start = Date.now()
                        
                    if (!comment.sent){
                        const files = privateFileIDs.map(e=>{
                            const {id,name,size} = googleFileSelector.selectById(state,e)
                            return {id,name,size}
                        })
                        try {
                            const 
                                result = await baseQuery(fetchConfig(`${PATH}/tasks/add-comment`,'POST',{comment,files,publicFileIDs}))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsid:string}
                            if (data.success){
                                dispatch(taskEditComment({id:commentID,changes:{sent:true}}))
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                            }
                        } catch {}
                    } else {
                        const 
                            existingPrivateFileIDs = comment.fileIDs,
                            newPrivateFileIDs = privateFileIDs.filter(e=>!existingPrivateFileIDs.includes(e)),
                            newPrivateFiles = newPrivateFileIDs.map(e=>{
                                const {id,name,size} = googleFileSelector.selectById(state,e)
                                return {id,name,size}
                            })
                            
                        try {
                            const 
                                result = await baseQuery(fetchConfig(`${PATH}/tasks/edit-comment`,'POST',{
                                    id:commentID,
                                    taskID:comment.taskID,
                                    editDT:comment.editDt,
                                    content:comment.content,
                                    newPublicFileIDs:publicFileIDs,
                                    privateFileIDs,
                                    newFiles:newPrivateFiles
                                }))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsid:string}
                            if (data.success){
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                            }
                        } catch {}
                    }
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            taskAttachmentUploaded:build.mutation<any,EntityId>({
                async queryFn(internalFileID,{dispatch,getState},_,baseQuery){
                    const
                        state = getState() as ReduxState,
                        file = googleFilePrelimSelector.selectById(state,internalFileID),
                        grandParentID = file.grandParentID,
                        files = googleFilePrelimSelector.selectAll(state),
                        filesOfThis = files.filter(f=>f.grandParentID===grandParentID),

                        task = taskSelector.selectById(state,grandParentID),
                        comment = taskCommentSelector.selectById(state,grandParentID),
                        publicFiles = filesOfThis.filter(f=>f.folder==='public'),
                        privateFiles = filesOfThis.filter(f=>f.folder==='private'),
                        publicFilesLen = publicFiles.length,
                        allFilesUploaded = filesOfThis.every(f=>f.googleFileID!==''),
                        start = Date.now()

                    if (!!task){
                        if (!task.sent && !allFilesUploaded) return {data:null}

                        const filesOfThisField = files.filter(f=>f.parentID===file.parentID)
                        if (task.sent && !filesOfThisField.every(f=>f.googleFileID!=='')) return {data:null}
                            
                        let 
                            longTextContents:{[k:string]:string} = {},
                            finalPublicFileIDs:EntityId[] = []

                        if (publicFilesLen !== 0){
                            const 
                                fieldIDs = Array.from(new Set(publicFiles.map(e=>e.parentID))),
                                fieldLen = fieldIDs.length

                            for (let i=0; i<fieldLen; i++){
                                const fieldID = fieldIDs[i]
                                if (!task[fieldID]) continue

                                let text = `${task[fieldID]}`

                                for (let j=0; j<publicFilesLen; j++){
                                    const f = publicFiles[j]
                                    if (text.includes(f.dataUrl)){
                                        finalPublicFileIDs = [...finalPublicFileIDs,f.googleFileID]
                                        text = text.replaceAll(f.dataUrl,`https://drive.google.com/uc?export=view&id=${f.googleFileID}`)
                                    }
                                }

                                longTextContents = {...longTextContents,[fieldID]:text}
                            }
                        }

                        dispatch(taskUpdateOne({id:task.id,changes:{
                            ...(!!Object.keys(longTextContents).length && longTextContents),
                            ...(!!privateFiles.length && {
                                fileIDs:[
                                    ...task.fileIDs.filter(e=>privateFiles.findIndex(f=>f.id===e)===-1),
                                    ...privateFiles.map(e=>e.googleFileID)
                                ],
                                filesToDelete:[
                                    ...task.filesToDelete,
                                    ...privateFiles.filter(e=>task.filesToDelete.includes(e.id)).map(e=>e.googleFileID)
                                ]
                            })
                        }}))
                        
                        if (!task.sent) {
                            dispatch(taskApi.endpoints.addTaskToDB.initiate({
                                taskID:grandParentID,
                                publicFileIDs:finalPublicFileIDs,
                                privateFileIDs:privateFiles.map(f=>f.googleFileID)
                            }))
                        } else {
                            const result = await baseQuery(fetchConfig(`${PATH}/tasks/edit-task-with-new-files`,'POST',{
                                taskID:task.id,
                                longTextMap:longTextContents,
                                publicFileIDs:finalPublicFileIDs,
                                privateFiles:privateFiles.map(e=>({id:e.googleFileID,name:e.fileName,size:e.fileSize}))
                            }))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsid:string}
                            if (data.success){
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                            }
                        }
                    } else if (!!comment){
                        if (!allFilesUploaded) return {data:null}
                        let 
                            text = `${comment.content}`,
                            finalPublicFileIDs:EntityId[] = []

                        for (let j=0; j<publicFilesLen; j++){
                            const f = publicFiles[j]
                            if (text.includes(f.dataUrl)){
                                finalPublicFileIDs = [...finalPublicFileIDs,f.googleFileID]
                                text = text.replaceAll(f.dataUrl,`https://drive.google.com/uc?export=view&id=${f.googleFileID}`)
                            }
                        }

                        const newPrivateFileIDs = [
                            ...comment.fileIDs.filter(e=>privateFiles.findIndex(f=>f.id===e)===-1),
                            ...privateFiles.map(e=>e.googleFileID)
                        ]

                        dispatch(taskEditComment({
                            id:comment.id,
                            changes:{
                                content:text,
                                ...(!comment.sent && {fileIDs:newPrivateFileIDs})
                            }
                        }))

                        if (!comment.sent){
                            dispatch(taskApi.endpoints.updateCommentInDB.initiate({
                                commentID:comment.id,
                                publicFileIDs:finalPublicFileIDs,
                                privateFileIDs:privateFiles.map(e=>e.googleFileID)
                            }))
                        } else {
                            dispatch(taskApi.endpoints.updateCommentInDB.initiate({
                                commentID:comment.id,
                                publicFileIDs:finalPublicFileIDs,
                                privateFileIDs:newPrivateFileIDs
                            }))
                        }
                    }
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            uploadingBeforeUpsert:build.mutation<any,{
                files:FileDraft[];
                taskOrCommentID:EntityId;
            }>({
                queryFn({files,taskOrCommentID},{dispatch}){
                    dispatch(googleUploadApi.endpoints.addNewGoogleFiles.initiate(files.map(f=>({
                        id:f.id,
                        parentType:'task',
                        mimeType:f.mimeType,
                        folder:f.folder,
                        googleFileID:'',
                        uploadEndpoint:'',
                        parentID:f?.parentID || '',
                        grandParentID:taskOrCommentID,
                        dataUrl:f.url,
                        fileName:f.name,
                        fileSize:f.size,
                        uploaded:0,
                        uploading:false,
                        error:false,
                    }))))
                    return {data:null}
                }
            }),
            addTask:build.mutation<any,TaskEdit>({
                async queryFn(t,{dispatch,getState}){
                    const 
                        now = Date.now(),
                        taskID = uuidv4(),

                        state = getState() as ReduxState,
                        uid = state.misc.uid,
                        longTextFields = taskFieldSelector.selectAll(state).filter(e=>e.fieldType==='long_text').map(({id})=>id),
                        publicFileDraftsResults = await Promise.all(longTextFields.map(fieldID=>getBlobUrlFromText(t[fieldID],fieldID))),
                        filesToUpload = [...t.files.filter(e=>e.url.startsWith('blob:')),...publicFileDraftsResults.map(({files})=>files).flat()],
                        orderInBoardColumnFieldID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='order_in_board_column').id,

                        extraFieldObj = {
                            ...getExtraFieldObjFromTaskEdit(
                                state,
                                {
                                    ...t,
                                    ...objArrToObj(publicFileDraftsResults.filter(e=>e.fieldID!=='description').map(e=>({[e.fieldID]:e.finalString})))
                                }
                            ),
                            [orderInBoardColumnFieldID]:0
                        },

                        newTask:Task = {
                            id:taskID,
                            name:t.name,
                            description:publicFileDraftsResults.find(e=>e.fieldID==='description').finalString,
                            createDT:now,
                            startDT:!!t.startDT_edit ? t.startDT_edit.valueOf() : 0,
                            deadlineDT:!!t.deadlineDT_edit ? t.deadlineDT_edit.valueOf() : 0,
                            owner:uid,
                            isGroupTask:t.isGroupTask,
                            supervisors:t.supervisors,
                            participants:t.participants,
                            viewers:t.viewers,
                            trackTime:t.trackTime,
                            hourlyRate:isNaN(+t.hourlyRate_edit) ? 0 : +t.hourlyRate_edit,
                            fileIDs:t.files.map(e=>e.id),//t.files.filter(e=>!e.url.startsWith('blob:')).map(e=>e.id),
                            filesToDelete:[],
                            parents:!!t.parent ? [t.parent,taskID] : [taskID],
                            sent:false,
                            approval:t.approval,
                            assignee:t.assignee || uid,
                        }
                    dispatch(taskAddOne({...newTask,...extraFieldObj}))

                    if (filesToUpload.length !== 0) dispatch(taskApi.endpoints.uploadingBeforeUpsert.initiate({
                        files:filesToUpload,
                        taskOrCommentID:taskID
                    }))
                    else dispatch(taskApi.endpoints.addTaskToDB.initiate({taskID,publicFileIDs:[],privateFileIDs:[]}))

                    return {data:null}
                }
            }),
            taskAddCustomField:build.mutation<any,{
                f:IcustomField,
                fieldID:EntityId;
                wideScreen:boolean;
            }>({
                async queryFn({f,fieldID,wideScreen},{dispatch,getState},_,baseQuery){
                    const 
                        {fieldType} = f,
                        fieldName = f.name,
                        state = getState() as ReduxState,
                        details = getCustomFieldDetails(f),
                        finalField:TaskField = {
                            id:fieldID,
                            fieldName,
                            fieldType,
                            details,
                            listWideScreenOrder:Math.max(...taskFieldSelector.selectAll(state).map(e=>e.listWideScreenOrder))+1,
                            listNarrowScreenOrder:wideScreen ? -1 : Math.max(...taskFieldSelector.selectAll(state).map(e=>e.listNarrowScreenOrder))+1,
                            detailsSidebarExpand:true,
                            detailsSidebarOrder:Math.max(...taskFieldSelector.selectAll(state).map(e=>e.detailsSidebarOrder))+1,
                        },
                        start = Date.now()

                    dispatch(addCustomField(finalField))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/add-custom-field`,'POST',{id:fieldID,fieldName,fieldType,details}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            taskEditCustomField:build.mutation<any,{
                f:IcustomField;
                id:EntityId
            }>({
                async queryFn({f,id},{dispatch},_,baseQuery){
                    const 
                        fieldName = f.name,
                        details = getCustomFieldDetails(f),
                        start = Date.now()

                    dispatch(editCustomField({id,changes:{fieldName,details}}))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/edit-custom-field-config`,'POST',{id,fieldName,details}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            taskUpdateOneField:build.mutation<any,{
                id:EntityId;
                field:EntityId;
                value:any;
            }>({
                async queryFn({id,field,value},{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        uid = state.misc.uid,
                        task = taskSelector.selectById(state,id),
                        groupWithEditRight = [...task.supervisors,task.owner],
                        start = Date.now()

                    const fieldObj = taskFieldSelector.selectById(state,field)
                    if (!fieldObj && groupWithEditRight.includes(uid)){
                        dispatch(taskUpdateOne({id,changes:{[field]:value}}))
                        return {data:null}
                    }
                    
                    if (!fieldObj.details){
                        const 
                            hasAllRights = groupWithEditRight.includes(uid),
                            isAssignee = field==='assignee' && task.assignee===uid,
                            isParticpant = (['participants','viewers'] as EntityId[]).includes(field) && task.participants.includes(uid),
                            isViewer = field==='viewers' && task.viewers.includes(uid)

                        if (!hasAllRights && !isAssignee && !isParticpant && !isViewer) return {data:null}
                    } 

                    if (fieldObj.fieldType==='long_text'){
                        const {files,finalString} = await getBlobUrlFromText(value as string,field)
                        dispatch(taskUpdateOne({id,changes:{[field]:finalString}}))
                        if (!!files.length) {
                            dispatch(taskApi.endpoints.uploadingBeforeUpsert.initiate({files,taskOrCommentID:id}))
                            return {data:null}
                        }
                    } else dispatch(taskUpdateOne({id,changes:{[field]:value}}))
                    
                    if (!fieldObj.details){
                        let taskRecord:TaskRecord = {
                            id:uuidv4(),
                            taskID:id,
                            requester:uid,
                            action:field.toString(),
                            dt:field==='approval' ? start : 0,
                            approval:field==='approval' ? value : 0,
                            addPersonnel:[],
                            removePersonnel:[]
                        }
                        if (fieldObj.fieldType==='single_person') {
                            taskRecord.addPersonnel = [value]
                            taskRecord.dt = start
                        } else if (fieldObj.fieldType==='people') {
                            taskRecord.addPersonnel = (value as EntityId[]).filter(e=>!(task[field] as EntityId[]).includes(e))
                            taskRecord.removePersonnel = (task[field] as EntityId[]).filter(e=>!(value as EntityId[]).includes(e))
                            taskRecord.dt = start
                        }

                        if (taskRecord.dt !== 0) dispatch(addTaskRecord(taskRecord))

                        try {
                            const result = await baseQuery(fetchConfig(`${PATH}/tasks/edit-main-field`,'POST',{
                                taskID:id,
                                value,
                                field:fieldObj.nameInDB || fieldObj.id,
                                taskRecord
                            }))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsids:string[]}
                            if (data.success){
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({reqs:data.wsids}))
                            }
                        } catch {}
                    } else {
                        try {
                            const result = await baseQuery(fetchConfig(`${PATH}/tasks/edit-extra-field`,'POST',{
                                taskID:id,
                                value:JSON.stringify(value),
                                field:fieldObj.id
                            }))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsid:string}
                            if (data.success){
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                            }
                        } catch {}
                    }
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            taskAddFiles:build.mutation<any,{
                taskID:EntityId;
                files:FileDraft[];
            }>({
                async queryFn({taskID,files},{dispatch,getState}){
                    dispatch(taskApi.endpoints.uploadingBeforeUpsert.initiate({taskOrCommentID:taskID,files}))
                    const
                        state = getState() as ReduxState,
                        task = taskSelector.selectById(state,taskID)
                    dispatch(taskUpdateOne({id:taskID,changes:{fileIDs:[...task.fileIDs,...files.map(({id})=>id)]}}))
                    return {data:null}
                }
            }),
            taskDeleteBoardColumn:build.mutation<any,{
                action:EntityId;
                newDefault:EntityId;
            }>({
                async queryFn({action,newDefault},{dispatch,getState},_,baseQuery){
                    const
                        state = getState() as ReduxState,
                        boardColumnIdToDelete = state.taskMgmt.ctxMenuBoardColumnID,
                        boardColumnFieldObj = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column'),
                        initialDefaultColumnID = boardColumnFieldObj.details.default,
                        payload = {
                            action,
                            boardColumnIdToDelete:state.taskMgmt.ctxMenuBoardColumnID,
                            ...(initialDefaultColumnID===boardColumnIdToDelete && {newDefault})
                        },
                        start = Date.now()

                    dispatch(taskDeleteBoardColumn(payload))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/delete-board-column`,'POST',payload))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsids:string[]}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({reqs:data.wsids}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            deleteTask:build.mutation<any,EntityId>({
                async queryFn(taskID,{dispatch,getState},_extra,baseQuery){
                    const
                        state = getState() as ReduxState,
                        task = taskSelector.selectById(state,taskID),
                        uid = state.misc.uid,
                        usersWithDeleteRights = [...task.supervisors,task.owner],
                        start = Date.now()

                    if (!usersWithDeleteRights.includes(uid)) return {data:null}
                    dispatch(deleteTask(taskID))
                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/delete-task`,'POST',{taskID}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(start))
                    return {data:null}
                }
            }),
            taskUpdateMyTimer:build.mutation<any,EntityId>({
                async queryFn(taskID,{dispatch,getState},_,baseQuery){
                    const 
                        now = Date.now(),
                        state = getState() as ReduxState,
                        uid = state.misc.uid,
                        newTimeRecordID = uuidv4(),
                        timerRunning = taskTimeRecordsSelector.selectAll(state).find(r=>r.uid===uid && r.end===0)

                    if (!!timerRunning) dispatch(taskEndTimer({timerID:timerRunning.id,time:now}))
                    if (!timerRunning || timerRunning.taskID!==taskID) dispatch(taskStartTimer({
                        id:newTimeRecordID,
                        taskID,
                        uid,
                        start:now,
                        end:0,
                    }))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/update-timer`,'POST',{taskID,newTimeRecordID,time:now}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(now))
                    return {data:null}
                }
            }),
            taskDeleteCustomField:build.mutation<any,{
                fieldID:EntityId;
                updates:Update<TaskField>[];
            }>({
                async queryFn({fieldID,updates},{dispatch},_,baseQuery){
                    dispatch(taskDeleteCustomField({fieldID,updates}))
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/tasks/delete-custom-field`,'POST',{fieldID}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    return {data:null}
                }
            }),
            taskAddComment:build.mutation<any,{
                taskID:EntityId;
                comment:string;
                privateFiles:FileDraft[];
                replyCommentID?:EntityId;
            }>({
                async queryFn({taskID,comment,privateFiles,replyCommentID},{dispatch,getState}){
                    const 
                        state = getState() as ReduxState,
                        commentID = uuidv4(),
                        now = Date.now(),
                        replyMsg = taskCommentSelector.selectById(state,replyCommentID)?.content || '',
                        replyMsgSender = taskCommentSelector.selectById(state,replyCommentID)?.sender || '',
                        {files:publicFiles,finalString} = await getBlobUrlFromText(comment,''),
                        files = [...privateFiles,...publicFiles]

                    if (!!files.length) dispatch(taskApi.endpoints.uploadingBeforeUpsert.initiate({files,taskOrCommentID:commentID}))

                    dispatch(taskAddComment({
                        id:commentID,
                        taskID,
                        content:finalString,
                        sender:state.misc.uid,
                        dt:now,
                        editDt:0,
                        fileIDs:privateFiles.map(({id})=>id),
                        replyMsgID:replyCommentID || '',
                        replyMsg,
                        replyMsgSender,
                        sent:false,
                        deleted:false,
                        deleteDT:0,
                    }))

                    if (!files.length) dispatch(taskApi.endpoints.updateCommentInDB.initiate({commentID,publicFileIDs:[],privateFileIDs:[]}))

                    return {data:null}
                }
            }),
            taskDeleteComment:build.mutation<any,EntityId>({
                async queryFn(commentID,{dispatch,getState},_,baseQuery){
                    const 
                        now = Date.now(),
                        state = getState() as ReduxState,
                        comment = taskCommentSelector.selectById(state,commentID),
                        payload = {id:commentID,time:now}
                    dispatch(taskDeleteComment(payload))
                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/delete-comment`,'POST',{...payload,taskID:comment.taskID}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        }
                    } catch {}
                    dispatch(sessionRenewTime(now))
                    return null
                }
            }),
            taskEditComment:build.mutation<any,{
                id:EntityId;
                content:string;
                privateFiles:FileDraft[];
            }>({
                async queryFn({id,content,privateFiles},{dispatch}){
                    const 
                        now = Date.now(),
                        {files:publicFiles,finalString} = await getBlobUrlFromText(content,''),
                        files = [...publicFiles,...privateFiles],
                        newFiles = files.filter(e=>!!e.url)

                    if (!!newFiles.length) dispatch(
                        taskApi.endpoints.uploadingBeforeUpsert.initiate({files:newFiles,taskOrCommentID:id})
                    )

                    dispatch(taskEditComment({id,changes:{content:finalString,editDt:now,fileIDs:privateFiles.map(e=>e.id)}}))

                    if (!newFiles.length) dispatch(taskApi.endpoints.updateCommentInDB.initiate({
                        commentID:id,
                        publicFileIDs:[],//publicFiles.map(({id})=>id),
                        privateFileIDs:privateFiles.map(e=>e.id)
                    }))
                    dispatch(sessionRenewTime(now))
                    return {data:null}
                }
            }),
            taskMovedInBoard:build.mutation<any,{
                taskID:EntityId;
                newColumnID:EntityId;
                newIdxInColumn:number;
                active:boolean;
            }>({
                async queryFn({taskID,newColumnID,newIdxInColumn,active},{getState,dispatch},_,baseQuery){
                    const
                        state = getState() as ReduxState,
                        boardColumnField = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column'),
                        boardColumnFieldID = boardColumnField.id,
                        boardColumns = boardColumnField.details.options as IboardColumn[],
                        columnLen = boardColumns.length,
                        boardColumnOrderFieldID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='order_in_board_column').id,

                        allTasks = taskSelector.selectAll(state),
                        task = taskSelector.selectById(state,taskID),
                        originalColumnID = task[boardColumnFieldID],
                        columnsToObserve = Array.from(new Set([originalColumnID,newColumnID]))

                    let updates:Update<Task>[] = []

                    for (let i=0; i<columnLen; i++){
                        const colID = boardColumns[i].id
                        if (!columnsToObserve.includes(colID)) continue

                        const 
                            arr = allTasks.filter(e=>e[boardColumnFieldID]===colID && e.id !== taskID),
                            len = arr.length
                        let newTaskIDs = !len ? [] : len===1 ? [arr[0].id] : Array.from(arr).sort((a,b)=>a[boardColumnOrderFieldID] - b[boardColumnOrderFieldID]).map(({id})=>id)

                        if (originalColumnID === newColumnID || colID === newColumnID){
                            if (newIdxInColumn===0) newTaskIDs = [taskID,...newTaskIDs]
                            else if (newIdxInColumn===newTaskIDs.length) newTaskIDs = [...newTaskIDs,taskID]
                            else newTaskIDs = [...newTaskIDs.slice(0,newIdxInColumn),taskID,...newTaskIDs.slice(newIdxInColumn)]
                        }

                        updates = [
                            ...updates,
                            ...newTaskIDs.map((e,i)=>({
                                id:e,
                                changes:{
                                    [boardColumnOrderFieldID]:i,
                                    [boardColumnFieldID]:colID
                                }
                            }))
                        ]
                    }

                    dispatch(taskBulkUpdate(updates))

                    if (active){
                        try {
                            const 
                                start = Date.now(),
                                result = await baseQuery(fetchConfig(`${PATH}/tasks/task-moved-in-board`,'POST',{
                                    taskID,
                                    newColumnID,
                                    newIdxInColumn,
                                }))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {success:boolean;wsid:string}
                            if (data.success){
                                dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                            }
                            dispatch(sessionRenewTime(start))
                        } catch {}
                    }

                    return {data:null}
                }
            }),
            taskUpdateParents:build.mutation<any,{
                taskID:EntityId;
                parent:EntityId;
            }>({
                async queryFn({taskID,parent},{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        currentParents = taskSelector.selectById(state,taskID).parents,
                        currLen = currentParents.length

                    // if input value same as original parent
                    if (currLen===1 && !parent || !!parent && currLen > 1 && currentParents[currLen - 2]===parent) return {data:null}

                    let tempParents:EntityId[] = []
                    
                    if (!!parent){
                        const parentTask = taskSelector.selectById(state,parent)
                        tempParents = [...parentTask.parents,taskID]
                    } else tempParents = [taskID]

                    const tasksToUpdate = taskSelector.selectAll(state).filter(e=>e.parents.includes(taskID))
                    dispatch(taskBulkUpdate(tasksToUpdate.map(e=>({
                        id:e.id,
                        changes:{
                            parents:[...tempParents,...(taskID !== e.id ? e.parents.slice(e.parents.indexOf(taskID) + 1) : [])]
                        }
                    }))))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/tasks/update-parents`,'POST',{taskID,parent}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {
                            success:boolean;
                            wsid:string;
                            parents:EntityId[];
                            parent?:{
                                id:EntityId;
                                name:string;
                                owner:EntityId;
                                approval:number;
                            }
                        }
                        if (!data.success) return {data:null}
                        
                        dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))

                        const childTasks = taskSelector.selectAll(state).filter(e=>e.parents.includes(taskID))
                        dispatch(taskBulkUpdate(childTasks.map(e=>({
                            id:e.id,
                            changes:{
                                parents:[...data.parents,...(taskID !== e.id && e.parents.slice(e.parents.indexOf(taskID) + 1))]
                            }
                        }))))

                        if (!!data.parent) dispatch(taskUpdateOne({
                            id:data.parent.id,changes:{
                                name:data.parent.name,
                                owner:data.parent.owner,
                                approval:data.parent.approval
                            }
                        }))
                    } catch {}
                    
                    return {data:null}
                }
            })
        })
    })
export const {
    useAddTaskMutation,
    useTaskUpdateMyTimerMutation,
    useTaskUpdateOneFieldMutation,
    // useTaskAddApprovalRecordMutation,
    useTaskAddFilesMutation,
    useTaskDeleteCustomFieldMutation,
    useTaskAddCommentMutation,
    useTaskDeleteCommentMutation,
    useTaskEditCommentMutation,
    useTaskMovedInBoardMutation,
    useTaskUpdateParentsMutation,
    useTaskEditCustomFieldMutation,
} = taskApi
export default taskApi