import { ReduxState } from "@reducers";
import apiSlice from "@reducers/api";
import { gFilesUpsertMany } from "@reducers/google-download-api/slice";
import userDetailsApi from "@reducers/user-details/api";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { EntityId } from "@reduxjs/toolkit";
import taskApi from "./api";
import { taskAddOne, taskFieldSelector, taskSelector, taskUpdateOne, editCustomField, taskDeleteBoardColumn, taskEndTimer, taskStartTimer, taskTimeRecordsSelector, addCustomField, taskDeleteCustomField, taskAddComment, taskDeleteComment, taskEditComment, deleteTask, addTaskRecord, addParentChildTask, taskBulkUpdate } from "./slice";
import { IaddCommentPayload, IaddCustomFieldPayload, IdeleteBoardColumnPayload, IdeleteCommentPayload, IdeleteCustomFieldPayload, IdeleteTaskPayload, IeditCommentPayload, IeditCustomFieldConfigPayload, IeditExtraTaskPayload, IeditMainTaskPayload, IeditTaskWithNewFilesPayload, InewTaskPayload, IparentChildTaskPayload, IupdateParentPayload, IupdateTimerPayload } from "./ws-message-types";
import { updateTaskFieldLayoutInRedux } from "@indexeddb/functions";
import { Task } from "../interfaces";

const taskWsHandlerApi = apiSlice.injectEndpoints({
    endpoints:build=>({
        newTask:build.mutation<any,InewTaskPayload>({
            async queryFn({
                task,
                extraFieldObj,
                files,
            },{
                dispatch,
                getState,
            }){
                const 
                    state = getState() as ReduxState,
                    userIDs = Array.from(new Set([
                        ...task.supervisors,
                        ...task.participants,
                        ...task.viewers,
                        task.owner,
                        task.assignee,
                    ])),
                    existingUsers = userDetailsSelector.selectAll(state).filter(e=> !!e.firstName || !!e.lastName).map(e=>e.id),
                    newUserIDs = userIDs.filter(e=>!existingUsers.includes(e)),
                    existingTaskIDs = taskSelector.selectIds(state),
                    parentIDsNotInStore = task.parents.filter(e=>!existingTaskIDs.includes(e) && e!==task.id)

                if (!!parentIDsNotInStore.length) await dispatch(taskApi.endpoints.fetchParentChildTask.initiate(parentIDsNotInStore)).unwrap()

                if (!!newUserIDs.length) await dispatch(userDetailsApi.endpoints.fetchUsers.initiate(newUserIDs)).unwrap()

                if (!!files.length) dispatch(gFilesUpsertMany(files.map(f=>({
                    ...f,
                    downloading:false,
                    progress:0,
                    error:false,
                    url:''
                }))))

                dispatch(taskAddOne({...task,...extraFieldObj}))
                return {data:null}
            }
        }),
        editMainField:build.mutation<any,IeditMainTaskPayload>({
            async queryFn({taskID,field,value,taskRecord},{dispatch,getState}){
                // console.log(taskID,field,value,taskRecord)

                
                const 
                    state = getState() as ReduxState,
                    uid = state.misc.uid,
                    task = taskSelector.selectById(state,taskID)
                if (!task || ![...task.supervisors,...task.participants,...task.viewers,task.owner,task.assignee].includes(uid)) await dispatch(taskApi.endpoints.fetchTask.initiate(taskID)).unwrap()
                else {
                    const
                        fieldObj = taskFieldSelector.selectAll(state).find(e=>e.id===field || !!e.nameInDB && e.nameInDB===field),
                        fieldType = fieldObj.fieldType.toString()
                    if (['people','single_person'].includes(fieldType)){
                        const 
                            userIDs = (fieldType==='people' ? value : [value]) as EntityId[],
                            existingUserIDs = userDetailsSelector.selectIds(state),
                            newUserIDs = userIDs.filter(e=>!existingUserIDs.includes(e))
                        if (!!newUserIDs.length) await dispatch(userDetailsApi.endpoints.fetchUsers.initiate(newUserIDs)).unwrap()
                    }
                    dispatch(taskUpdateOne({id:taskID,changes:{[fieldObj.id]:value}}))
                }
                // if (!!taskRecord.dt) dispatch(addTaskRecord(taskRecord))
                // console.log(taskID,field,value,taskRecord)
                return {data:null}
            }
        }),
        editExtraField:build.mutation<any,IeditExtraTaskPayload>({
            async queryFn({taskID,field,value},{dispatch}){
                dispatch(taskUpdateOne({id:taskID,changes:{[field]:JSON.parse(value)}}))
                return {data:null}
            }
        }),
        editCustomFieldConfig:build.mutation<any,IeditCustomFieldConfigPayload>({
            async queryFn({id,fieldName,details},{dispatch}){
                dispatch(editCustomField({id,changes:{fieldName,details}}))
                return {data:null}
            }
        }),
        deleteBoardColumn:build.mutation<any,IdeleteBoardColumnPayload>({
            queryFn({boardColumnIdToDelete,action,newDefault},{dispatch}){
                dispatch(taskDeleteBoardColumn({action,boardColumnIdToDelete,...(!!newDefault && {newDefault})}))
                return {data:null}
            }
        }),
        updateTimer:build.mutation<any,IupdateTimerPayload>({
            queryFn({userID,time,newTimeRecordID,startTaskID,endTimerID},{dispatch,getState}){
                const state = getState() as ReduxState
                if (!!endTimerID) {
                    const timerIDs = taskTimeRecordsSelector.selectIds(state)
                    if (timerIDs.includes(endTimerID)) dispatch(taskEndTimer({timerID:endTimerID,time}))
                }
                if (!!startTaskID && !!newTimeRecordID){
                    const taskIDs = taskSelector.selectIds(state)
                    // console.log(taskIDs,startTaskID)
                    if (taskIDs.includes(startTaskID)) dispatch(taskStartTimer({
                        id:newTimeRecordID,
                        uid:userID,
                        taskID:startTaskID,
                        start:time,
                        end:0,
                    }))
                }
                return {data:null}
            }
        }),
        addCustomField:build.mutation<any,IaddCustomFieldPayload>({
            async queryFn({id,fieldName,fieldType,details},{dispatch,getState}){
                const 
                    _fieldType = fieldType.toString(),
                    state = getState() as ReduxState,
                    allFields = taskFieldSelector.selectAll(state)

                if (['people','single_person'].includes(_fieldType)){
                    const 
                        userIDs = (_fieldType==='single_person' ? [details.default] : details.default) as EntityId[],
                        existingUserIDs = userDetailsSelector.selectIds(state),
                        newUserIDs = userIDs.filter(e=>!existingUserIDs.includes(e))

                    if (!!newUserIDs.length) await dispatch(userDetailsApi.endpoints.fetchUsers.initiate(newUserIDs)).unwrap()
                }
                dispatch(addCustomField({
                    id,
                    fieldName,
                    fieldType,
                    details,
                    listWideScreenOrder:Math.max(...allFields.map(e=>e.listWideScreenOrder))+1,
                    listNarrowScreenOrder:-1,
                    detailsSidebarExpand:true,
                    detailsSidebarOrder:Math.max(...allFields.map(e=>e.detailsSidebarOrder))+1,
                }))
                return {data:null}
            }
        }),
        deleteCustomField:build.mutation<any,IdeleteCustomFieldPayload>({
            queryFn({fieldID},{dispatch,getState}){
                const 
                    state = getState() as ReduxState,
                    oldFields = taskFieldSelector.selectAll(state),
                    newFields = oldFields.filter(e=>e.id !== fieldID)
                dispatch(taskDeleteCustomField({fieldID,updates:updateTaskFieldLayoutInRedux(oldFields,newFields)}))
                return {data:null}
            }
        }),
        addComment:build.mutation<any,IaddCommentPayload>({
            queryFn({comment,files},{dispatch}){
                dispatch(gFilesUpsertMany(files.map(f=>({
                    ...f,
                    downloading:false,
                    error:false,
                    progress:0,
                    url:''
                }))))
                dispatch(taskAddComment({...comment,sent:true,editDt:0}))
                return {data:null}
            }
        }),
        deleteComment:build.mutation<any,IdeleteCommentPayload>({
            queryFn({id,time},{dispatch}){
                dispatch(taskDeleteComment({id,time}))
                return {data:null}
            }
        }),
        editTaskWithNewFiles:build.mutation<any,IeditTaskWithNewFilesPayload>({
            queryFn({taskID,longTextMap,uid,privateFiles},{dispatch,getState}){
                const 
                    state = getState() as ReduxState,
                    thisUserID = state.misc.uid,
                    task = taskSelector.selectById(state,taskID)
                if (!task || uid !== thisUserID && !privateFiles.length && !longTextMap.description) return {data:null}
                if (!!privateFiles.length) dispatch(gFilesUpsertMany(privateFiles.map(f=>({
                    ...f,
                    downloading:false,
                    error:false,
                    progress:0,
                    url:'',
                }))))
                dispatch(taskUpdateOne({
                    id:taskID,
                    changes:{
                        ...(!!privateFiles.length && {fileIDs:[...task.fileIDs,...privateFiles.map(e=>e.id)]}),
                        ...(thisUserID !== uid && !!longTextMap.description && {description:longTextMap.description}),
                        ...(thisUserID===uid && longTextMap)
                    }
                }))
                return {data:null}
            }
        }),
        editComment:build.mutation<any,IeditCommentPayload>({
            queryFn({id,editDt,content,privateFileIDs,newFiles},{dispatch}){
                if (!!newFiles.length) dispatch(gFilesUpsertMany(newFiles.map(f=>({
                    ...f,
                    downloading:false,
                    error:false,
                    progress:0,
                    url:'',
                }))))
                dispatch(taskEditComment({
                    id,
                    changes:{
                        editDt,
                        content,
                        fileIDs:privateFileIDs
                    }
                }))
                return {data:null}
            }
        }),
        deleteTaskFromWS:build.mutation<any,IdeleteTaskPayload>({
            queryFn({taskID},{dispatch}){
                dispatch(deleteTask(taskID))
                return {data:null}
            }
        }),
        handleParentChildTask:build.mutation<any,IparentChildTaskPayload>({
            queryFn({taskID,field,value},{dispatch,getState}){
                const 
                    state = getState() as ReduxState,
                    task = taskSelector.selectById(state,taskID)
                if (!task) dispatch(taskApi.endpoints.fetchParentChildTask.initiate([taskID]))
                else dispatch(taskUpdateOne({id:taskID,changes:{[field]:value}}))
                return {data:null}
            }
        }),
        addNewParentChildTask:build.mutation<any,Task>({
            queryFn(task,{dispatch}){
                dispatch(addParentChildTask(task))
                return {data:null}
            }
        }),
        updateParentsFromWS:build.mutation<any,IupdateParentPayload>({
            async queryFn({taskID,parents},{dispatch,getState}){
                const 
                    state = getState() as ReduxState,
                    existingTaskIDs = taskSelector.selectIds(state),
                    taskIDsNotInStore = parents.filter(e=>!existingTaskIDs.includes(e))
                    
                if (!!taskIDsNotInStore.length) await dispatch(taskApi.endpoints.fetchParentChildTask.initiate(taskIDsNotInStore)).unwrap()

                const tasks = taskSelector.selectAll(state).filter(e=>e.parents.includes(taskID))
                
                if (!!tasks.length) dispatch(taskBulkUpdate(tasks.map(e=>({
                    id:e.id,
                    changes:{
                        parents:[...parents,...(taskID !== e.id ? e.parents.slice(e.parents.indexOf(taskID) + 1) : [])]
                    }
                }))))
                return {data:null}
            }
        }),
    })
})

export default taskWsHandlerApi