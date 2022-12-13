import { createEntityAdapter, createSlice, EntityId, Update } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { ReduxState } from '@reducers'
import { v4 as uuidv4 } from 'uuid'
import { 
    Itask, 
    Task, 
    TaskField,
    TaskApproval, 
    TaskComment, 
    TaskCustomFieldType, 
    TaskTimeRecord,
    TaskRecord, 
} from '../interfaces'

const
    tempDefaultFields = [
        {
            id:'name',
            fieldType:'short_text',
            fieldName:'Name',
            listWideScreenOrder:true,
            listNarrowScreenOrder:true,
            detailsSidebarOrder:false,
            detailsSidebarExpand:false,
        },
        {
            id:'description',
            fieldType:'long_text',
            fieldName:'Description',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:false,
            detailsSidebarExpand:false,
        },
        {
            id:'createDT',
            fieldType:'date',
            fieldName:'Created on',
            nameInDB:'create_dt',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:false,
            detailsSidebarExpand:false,
        },
        {
            id:'startDT',
            fieldType:'date',
            fieldName:'Start',
            nameInDB:'start_dt',
            listWideScreenOrder:true,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'deadlineDT',
            fieldType:'date',
            fieldName:'Deadline',
            nameInDB:'deadline_dt',
            listWideScreenOrder:true,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'parents',
            fieldType:'parents',
            fieldName:'Parent',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'approval',
            fieldType:'approval',
            fieldName:'Approval',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'isGroupTask',
            fieldType:'checkbox',
            fieldName:'Group Task',
            nameInDB:'is_group_task',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'owner',
            fieldType:'single_person',
            fieldName:'Owner',
            listWideScreenOrder:true,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'assignee',
            fieldType:'single_person',
            fieldName:'Assignee',
            listWideScreenOrder:true,
            listNarrowScreenOrder:true,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'supervisors',
            fieldType:'people',
            fieldName:'Supervisors',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'participants',
            fieldType:'people',
            fieldName:'Participants',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'viewers',
            fieldType:'people',
            fieldName:'Viewers',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'trackTime',
            fieldType:'checkbox',
            fieldName:'Track Time',
            nameInDB:'track_time',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'hourlyRate',
            fieldType:'number',
            fieldName:'Hourly Rate',
            nameInDB:'hourly_rate',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'timer',
            fieldType:'timer',
            fieldName:'Timer',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'fileIDs',
            fieldType:'files',
            fieldName:'Files',
            nameInDB:'files',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:true,
            detailsSidebarExpand:true,
        },
        {
            id:'child_status',
            fieldType:'child_status',
            fieldName:'Child Tasks Status',
            listWideScreenOrder:false,
            listNarrowScreenOrder:false,
            detailsSidebarOrder:false,
            detailsSidebarExpand:false,
        },
    ],
    defaultFieldOrders = ['listWideScreenOrder','listNarrowScreenOrder','detailsSidebarOrder']
        .map(k=>({[k]:tempDefaultFields.filter(e=>e[k]).map(e=>e.id)}))
        .reduce((a,b)=>({...a,...b})),
    getDefaultFieldOrder = (e:'listWideScreenOrder'|'listNarrowScreenOrder'|'detailsSidebarOrder',id:string) => defaultFieldOrders[e].indexOf(id),
    defaultFields:TaskField[] = tempDefaultFields.map(e=>{
        const 
            {id,fieldName,fieldType,detailsSidebarExpand,nameInDB} = e,
            listWideScreenOrder = getDefaultFieldOrder('listWideScreenOrder',e.id),
            listNarrowScreenOrder = getDefaultFieldOrder('listNarrowScreenOrder',e.id),
            detailsSidebarOrder = getDefaultFieldOrder('detailsSidebarOrder',e.id)
        return {
            id,
            fieldName,
            fieldType,
            detailsSidebarExpand,
            listWideScreenOrder,
            listNarrowScreenOrder,
            detailsSidebarOrder,
            ...(!!nameInDB && {nameInDB})
        }
    }),
    taskAdapter = createEntityAdapter<Task>(),
    fieldAdapter = createEntityAdapter<TaskField>(),
    recordAdapter = createEntityAdapter<TaskRecord>(),
    commentAdapter = createEntityAdapter<TaskComment>(),
    approvalListAdapter = createEntityAdapter<TaskApproval>(),
    customFieldTypesAdapter = createEntityAdapter<TaskCustomFieldType>(),
    timeRecordAdapter = createEntityAdapter<TaskTimeRecord>(),

    sliceName = 'taskMgmt',
    initialState:Itask = {
        tasks:taskAdapter.getInitialState(),
        fields:{
            ids:defaultFields.map(({id})=>id),
            entities:defaultFields.map(e=>({[e.id]:e})).reduce((a,b)=>({...a,...b})),
        },
        comments:commentAdapter.getInitialState(),
        taskRecords:recordAdapter.getInitialState(),
        approvalList:approvalListAdapter.getInitialState(),
        customFieldTypes:customFieldTypesAdapter.getInitialState(),
        timeRecords:timeRecordAdapter.getInitialState(),
        ctxMenuFieldID:'',
        ctxMenuTaskID:'',
        ctxMenuBoardColumnID:'',
        ctxMenuFileID:'',
        editField:false,
        boardViewSmallScreenColumn:'',
    },
    slice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            taskEndTimer(state:Itask,{payload}:PayloadAction<{
                timerID:EntityId;
                time:number;
            }>){
                timeRecordAdapter.updateOne(state.timeRecords,{id:payload.timerID,changes:{end:payload.time}})
            },
            taskStartTimer(state:Itask,{payload}:PayloadAction<TaskTimeRecord>){
                timeRecordAdapter.addOne(state.timeRecords,payload)
            },
            taskAddOne(state:Itask,{payload}:PayloadAction<Task>){
                const 
                    boardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='board_column').id,
                    orderInBoardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='order_in_board_column').id,
                    existingTasksOfThisColumn = Object.values(state.tasks.entities).filter(e=>e[boardColumnFieldID]===payload[boardColumnFieldID])

                if (!!existingTasksOfThisColumn.length) taskAdapter.updateMany(state.tasks,existingTasksOfThisColumn.map(e=>({
                    id:e.id,
                    changes:{
                        [orderInBoardColumnFieldID]:e[orderInBoardColumnFieldID] + 1
                    }
                })))
                taskAdapter.addOne(state.tasks,payload)
                recordAdapter.addOne(state.taskRecords,{
                    id:uuidv4(),
                    taskID:payload.id,
                    requester:payload.owner,
                    action:'start',
                    approval:0,
                    dt:payload.createDT,
                    addPersonnel:[],
                    removePersonnel:[],
                })
            },
            taskUpdateOne(state:Itask,{payload}:PayloadAction<Update<Task>>){
                taskAdapter.updateOne(state.tasks,payload)
            },
            addCustomField(state:Itask,{payload}:PayloadAction<TaskField>){
                fieldAdapter.addOne(state.fields,payload)
                taskAdapter.updateMany(
                    state.tasks,
                    Object.values(state.tasks.entities)
                        .map(task=>({
                            id:task.id,
                            changes:{
                                [payload.id]:payload.details.default
                            }
                        })
                    )
                )
            },
            editCustomField(state:Itask,{payload}:PayloadAction<Update<TaskField>>){
                fieldAdapter.updateOne(state.fields,payload)
            },
            taskEditMultipleFields(state:Itask,{payload}:PayloadAction<Update<TaskField>[]>){
                fieldAdapter.updateMany(state.fields,payload)
            },
            taskDeleteCustomField(state:Itask,{payload}:PayloadAction<{
                fieldID:EntityId;
                updates:Update<TaskField>[];
            }>){
                fieldAdapter.updateMany(state.fields,payload.updates)
                fieldAdapter.removeOne(state.fields,payload.fieldID)
            },
            updateCtxMenuIDs(state:Itask,{payload}:PayloadAction<{
                field?:EntityId;
                taskid?:EntityId;
                boardcolumnid?:EntityId;
                fileid?:EntityId;
            }>){
                state.ctxMenuFieldID = payload.field || '';
                state.ctxMenuTaskID = payload.taskid || '';
                state.ctxMenuBoardColumnID = payload.boardcolumnid || '';
                state.ctxMenuFileID = payload.fileid || '';
            },
            taskEditSingleField(state:Itask,{payload}:PayloadAction<boolean>){
                state.editField = payload
            },
            
            taskDeleteBoardColumn(state:Itask,{payload}:PayloadAction<{
                action:EntityId;
                boardColumnIdToDelete:EntityId;
                newDefault?:EntityId;
            }>){
                const 
                    boardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='board_column').id,
                    orderInBoardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='order_in_board_column').id,
                    count = Object.values(state.tasks.entities).filter(e=>e[boardColumnFieldID]===payload.action)

                taskAdapter.updateMany(
                    state.tasks,
                    Object.values(state.tasks.entities)
                        .filter(t=>t[boardColumnFieldID]===payload.boardColumnIdToDelete)
                        .map(e=>({
                            id:e.id,changes:{
                                [boardColumnFieldID]:payload.action,
                                [orderInBoardColumnFieldID]:e[orderInBoardColumnFieldID] + count.length
                            }
                        }))
                )

                fieldAdapter.updateOne(
                    state.fields,
                    {
                        id:boardColumnFieldID,
                        changes:{
                            details:{
                                ...state.fields.entities[boardColumnFieldID].details,
                                options:state.fields.entities[boardColumnFieldID].details.options
                                    .filter(e=>e.id!==payload.boardColumnIdToDelete)
                                    .map((e,i)=>({...e,order:i})),
                                ...(!!payload.newDefault && {default:payload.newDefault})
                            }
                        }
                    }
                )

                if (state.boardViewSmallScreenColumn === payload.action) {
                    if (!!payload.newDefault) state.boardViewSmallScreenColumn = payload.newDefault
                    else state.boardViewSmallScreenColumn = state.fields.entities[boardColumnFieldID].details.default as EntityId
                }
            },
            deleteTask(state:Itask,{payload}:PayloadAction<EntityId>){
                taskAdapter.removeOne(state.tasks,payload)
            },
            taskAddComment(state:Itask,{payload}:PayloadAction<TaskComment>){
                commentAdapter.addOne(state.comments,payload)
            },
            taskDeleteComment(state:Itask,{payload:{id,time}}:PayloadAction<{
                id:EntityId;
                time:number;
            }>){
                commentAdapter.updateOne(state.comments,{id,changes:{deleted:true,deleteDT:time}})
            },
            taskEditComment(state:Itask,{payload}:PayloadAction<Update<TaskComment>>){
                commentAdapter.updateOne(state.comments,payload)
            },
            updateBoardViewSmallScreenColumn(state:Itask,{payload}:PayloadAction<EntityId>){
                state.boardViewSmallScreenColumn = payload
            },
            newTaskFetched(state:Itask,{payload:{task,comments,timeRecords}}:PayloadAction<{
                task:Task;
                comments:TaskComment[];
                timeRecords:TaskTimeRecord[];
            }>){
                const 
                    boardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='board_column').id,
                    orderInBoardColumnFieldID = Object.values(state.fields.entities).find(e=>e.fieldType==='order_in_board_column').id,
                    existingTasksOfThisColumn = Object.values(state.tasks.entities).filter(e=>e[boardColumnFieldID]===task[boardColumnFieldID]),
                    currentTaskIDs = state.tasks.ids

                if (!!existingTasksOfThisColumn.length) taskAdapter.updateMany(state.tasks,existingTasksOfThisColumn.map(e=>({
                    id:e.id,
                    changes:{
                        [orderInBoardColumnFieldID]:e[orderInBoardColumnFieldID] + 1
                    }
                })))
                if (!!comments.length) commentAdapter.upsertMany(state.comments,comments)
                if (!!timeRecords.length) timeRecordAdapter.upsertMany(state.timeRecords,timeRecords)
                // taskAdapter.upsertOne(state.tasks,task)
                if (currentTaskIDs.includes(task.id)) taskAdapter.updateOne(state.tasks,{id:task.id,changes:{...task}})
                else taskAdapter.addOne(state.tasks,task)

            },
            massDeleteTasks(state:Itask,{payload}:PayloadAction<EntityId[]>){
                taskAdapter.removeMany(state.tasks,payload)
            },
            taskBulkUpdate(state:Itask,{payload}:PayloadAction<Update<Task>[]>){
                taskAdapter.updateMany(state.tasks,payload)
            },
            addTaskRecord(state:Itask,{payload}:PayloadAction<TaskRecord>){
                recordAdapter.addOne(state.taskRecords,payload)
            },
            addParentChildTask(state:Itask,{payload}:PayloadAction<Task>){
                taskAdapter.addOne(state.tasks,payload)
            },
            addManyParentChildTask(state:Itask,{payload}:PayloadAction<Task[]>){
                taskAdapter.addMany(state.tasks,payload)
            },
        }
    }),
    taskSelector = taskAdapter.getSelectors((state:ReduxState)=>state[sliceName].tasks),
    taskFieldSelector = fieldAdapter.getSelectors((state:ReduxState)=>state[sliceName].fields),
    taskCommentSelector = commentAdapter.getSelectors((state:ReduxState)=>state[sliceName].comments),
    taskCustomFieldTypesSelector = customFieldTypesAdapter.getSelectors((state:ReduxState)=>state[sliceName].customFieldTypes),
    taskTimeRecordsSelector = timeRecordAdapter.getSelectors((state:ReduxState)=>state[sliceName].timeRecords),
    taskApprovalItemSelector = approvalListAdapter.getSelectors((state:ReduxState)=>state[sliceName].approvalList),
    taskRecordSelector = recordAdapter.getSelectors((state:ReduxState)=>state[sliceName].taskRecords)

export const {
    taskEndTimer,
    taskStartTimer,
    taskAddOne,
    taskUpdateOne,
    taskEditMultipleFields,
    taskDeleteCustomField,
    addCustomField,
    editCustomField,
    updateCtxMenuIDs,
    taskEditSingleField,
    taskDeleteBoardColumn,
    deleteTask,
    taskAddComment,
    taskDeleteComment,
    taskEditComment,
    updateBoardViewSmallScreenColumn,
    newTaskFetched,
    massDeleteTasks,
    taskBulkUpdate,
    addTaskRecord,
    addParentChildTask,
    addManyParentChildTask,
} = slice.actions
export type { Itask }
export { 
    sliceName, 
    initialState,
    taskSelector,
    taskFieldSelector,
    taskCommentSelector,
    taskCustomFieldTypesSelector,
    taskTimeRecordsSelector,
    taskApprovalItemSelector,
    taskRecordSelector,
}
export default slice.reducer