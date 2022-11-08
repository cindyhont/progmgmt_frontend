import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Istart {
    step:number;
    steps:string[];
    completed:boolean[];
    deptFormat?:'csv'|'manual';
    deptFileOK:boolean;
    deptManualOK:boolean;
    adminStaffID:string;
}

const
    sliceName = 'startPage',
    initialState:Istart = {
        step:0,
        steps:[
            'Import department names',
            'Import staff details',
            'Select yourself in staff list',
        ],
        completed:Array.from(Array(3),()=>false),
        deptFormat:'csv',
        deptFileOK:false,
        deptManualOK:false,
        adminStaffID:''
    },
    firstStepOK = (format:'csv'|'manual',fileOK:boolean,manualOK:boolean) => format==='csv' && fileOK || format==='manual' && manualOK,
    startPageSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            updateStep(state:Istart,{payload}: PayloadAction<number>){
                state.step = payload
            },
            updateDeptFormat(state:Istart,{payload}: PayloadAction<'csv'|'manual'>){
                state.deptFormat = payload;
                state.completed[0] = firstStepOK(payload,state.deptFileOK,state.deptManualOK)
            },
            deptFileStatus(state:Istart,{payload}: PayloadAction<boolean>){
                state.deptFileOK = payload
                state.completed[0] = firstStepOK(state.deptFormat,payload,state.deptManualOK)
            },
            deptManualStatus(state:Istart,{payload}: PayloadAction<boolean>){
                state.deptManualOK = payload
                state.completed[0] = firstStepOK(state.deptFormat,state.deptFileOK,payload)
            },
            staffDetailStatus(state:Istart,{payload}: PayloadAction<boolean>){
                state.completed[1] = payload
            },
            updateAdminStaffID(state:Istart,{payload}: PayloadAction<string>){
                state.adminStaffID = payload
                state.completed[2] = payload.length !== 0
            }
        }
    })

export const { 
    updateStep,
    updateDeptFormat,
    deptFileStatus,
    deptManualStatus,
    staffDetailStatus,
    updateAdminStaffID,
} = startPageSlice.actions
export { sliceName }
export default startPageSlice.reducer