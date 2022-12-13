import { createSlice, createSelector } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { filterItem, IhrmDept, ThrmDeptColumn } from '@components/hrm/interfaces'
import { rearrangeDeptFilters } from '@components/hrm/functions'
import { ReduxState } from '@reducers'
import { deptRowsPerPageOptions as rowsPerPageOptions } from '../../functions'

const 
    sliceName = 'hrmDept',
    
    initialState:IhrmDept = {
        page:0,
        limit:rowsPerPageOptions[0],
        filterMode:'AND',
        filters:[],
        sortBy:'',
        sortOrder:'',
    },
    hrmDeptSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            updatePage(state:IhrmDept,{payload}:PayloadAction<number>){
                state.page = payload
            },
            updateRowsPerPage(state:IhrmDept,{payload}:PayloadAction<number>){
                state.limit = payload
                state.page = 0
            },
            reorder(state:IhrmDept,{payload}:PayloadAction<ThrmDeptColumn>){
                if (payload === state.sortBy) state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
                else {
                    state.sortBy = payload
                    state.sortOrder = 'asc'
                }
                state.page = 0
            },
            updateFilterAndMode(state:IhrmDept,{payload}:PayloadAction<{
                mode:'AND'|'OR';
                fields:('internal_id'|'name')[];
                operators:("" | "equals" | "contains" | "start_with" | "end_with")[];
                values:string[];
            }>){
                let shouldUpdate = false, newFilters:filterItem[] = []
                const len = payload.fields.length;

                for (let i=0; i<len; i++){
                    newFilters.push({
                        field:payload.fields[i],
                        operator:payload.operators[i],
                        value:payload.values[i]
                    })
                }

                const
                    currFilters = rearrangeDeptFilters(newFilters),
                    prevFilters = Array.from(state.filters);
    
                if (prevFilters.length === 0 && currFilters.length === 0) shouldUpdate = false
                else if (payload.mode !== state.filterMode || currFilters.length !== prevFilters.length) shouldUpdate = true
                else {
                    const len = prevFilters.length
    
                    for (let i=0; i<len; i++){
                        const 
                            p = prevFilters[i],
                            c = currFilters[i]
        
                        if (p.field !== c.field || p.operator !== c.operator || p.value !== c.value) {
                            shouldUpdate = true
                            break
                        }
                    }
                }

                if (shouldUpdate){
                    state.filterMode = payload.mode
                    state.filters = [...currFilters]
                    state.page = 0
                }
            },
        }
    }),
    selectFilterMode = (state:ReduxState) => state.hrmDept.filterMode,
    selectFilters = (state:ReduxState) => state.hrmDept.filters,
    selectSortBy = (state:ReduxState) => state.hrmDept.sortBy,
    selectSortOrder = (state:ReduxState) => state.hrmDept.sortOrder,
    selectLimit = (state:ReduxState) => state.hrmDept.limit,
    selectPage = (state:ReduxState) => state.hrmDept.page,
    equalityFn = (a,b) => JSON.stringify(a)===JSON.stringify(b),
    backendDeptFilterSelector = () => createSelector(
        selectFilterMode,
        selectFilters,
        (filterMode,filters) => ({filterMode,filters}),
        {memoizeOptions:{equalityCheck:equalityFn}}
    ),
    frontendDeptFilterSelector = () => createSelector(
        selectFilterMode,
        selectFilters,
        selectSortBy,
        selectSortOrder,
        selectLimit,
        selectPage,
        (filterMode,filters,sortBy,sortOrder,limit,page) => ({filterMode,filters,sortBy,sortOrder,limit,page}),
        {memoizeOptions:{equalityCheck:equalityFn}}
    )


export const { 
    updatePage,
    updateRowsPerPage,
    reorder,
    updateFilterAndMode,
} = hrmDeptSlice.actions;
export type { IhrmDept }
export { 
    sliceName,
    backendDeptFilterSelector,
    frontendDeptFilterSelector
}
export default hrmDeptSlice.reducer