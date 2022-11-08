import { createSelector, createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { filterItem, IhrmStaff, IhrmStaffFrontendItem, ThrmStaffColumns } from '@components/hrm/interfaces'
import { IstaffFilterItem } from './filter'
import { ReduxState } from '@reducers'
import { staffRowsPerPageOptions as rowsPerPageOptions } from '@components/hrm/functions'

const 
    sliceName = 'hrmStaff',
    
    initialState:IhrmStaff = {
        page:0,
        limit:rowsPerPageOptions[0],
        filterMode:'AND',
        filters:[],
        sortBy:'',
        sortOrder:'',
        columnVisibility:Math.pow(2,14)-1, // there are 14 columns
    },
    hrmStaffSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            updatePage(state:IhrmStaff,{payload}:PayloadAction<number>){
                state.page = payload
            },
            updateRowsPerPage(state:IhrmStaff,{payload}:PayloadAction<number>){
                state.limit = payload
                state.page = 0
            },
            reorder(state:IhrmStaff,{payload}:PayloadAction<ThrmStaffColumns>){
                if (payload === state.sortBy) state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
                else {
                    state.sortBy = payload
                    state.sortOrder = 'asc'
                }
                state.page = 0
            },
            updateFilterAndMode(state:IhrmStaff,{payload}:PayloadAction<{
                mode:'AND'|'OR';
                filters:IstaffFilterItem[]
            }>){
                let shouldUpdate = false

                const 
                    {mode,filters} = payload,
                    currFilters = filters
                        .filter(({field,operator,value,department_ids,supervisor_ids,user_rights}) => {
                            if (field==='' || operator==='') return false
                            switch (field){
                                case 'staff_id':
                                case 'first_name':
                                case 'last_name':
                                case 'title':
                                    return value.trim().length !== 0
                                case 'department_id':
                                    return department_ids.length !== 0
                                case 'supervisor_id':
                                    return supervisor_ids.length !== 0
                                case 'user_right':
                                    return user_rights.length !== 0
                                default: return true
                            }
                        })
                        .map(({field,operator,value,department_ids,supervisor_ids,user_rights})=>{
                            switch (field){
                                case 'department_id':
                                    return {
                                        field,
                                        operator,
                                        values:department_ids.map(({id})=>id).sort()
                                    }
                                case 'supervisor_id':
                                    return {
                                        field,
                                        operator,
                                        values:supervisor_ids.map(({id})=>id).sort()
                                    }
                                case 'user_right':
                                    return {
                                        field,
                                        operator:operator==='includes' ? 'can' : 'cannot',
                                        values:user_rights.map(({value})=>value).sort()
                                    }
                                default: return {field,operator,value:value.trim()}
                            }
                        })
                        .sort((a,b)=>`${a.field}_${a.operator}_${a.value}_${JSON.stringify(a.values)}` > `${b.field}_${b.operator}_${b.value}_${JSON.stringify(b.values)}` ? 1 : -1) as filterItem[],
                    prevFilters = Array.from(state.filters)

                if (currFilters.length===0 && prevFilters.length===0) shouldUpdate = false
                else if (mode !== state.filterMode || currFilters.length !== prevFilters.length) shouldUpdate = true
                else {
                    const len = prevFilters.length

                    for (let i=0; i<len; i++){
                        const 
                            p = prevFilters[i],
                            c = currFilters[i]

                        if (p.field !== c.field || p.operator !== c.operator || p.value !== c.value || typeof p.values !== typeof c.values) {
                            shouldUpdate = true
                            break
                        }

                        if (!!p.values && !!c.values){
                            if (p.values.length !== c.values.length){
                                shouldUpdate = true
                                break
                            }

                            const 
                                pv = p.values,
                                cv = c.values,
                                vLen = pv.length
                            for (let j=0; j<vLen; j++){
                                if (pv[j] !== cv[j]) {
                                    shouldUpdate = true
                                    break
                                }
                            }

                            if (shouldUpdate) break
                        }
                    }
                }

                if (shouldUpdate) {
                    state.filterMode = mode
                    state.filters = [...currFilters]
                    state.page = 0
                }
            },
            updateColumnVisibility(state:IhrmStaff,{payload}:PayloadAction<number>){
                state.columnVisibility = payload
            },
        }
    }),
    createFieldValueSelector = (id:string,field:any,emptyResult:any) => createSelector(
        (res:IhrmStaffFrontendItem[]) => res.find(d=>d.id===id),
        (item:IhrmStaffFrontendItem) => !!item ? item[field] : emptyResult,
    ),
    selectFilterMode = (state:ReduxState) => state.hrmStaff.filterMode,
    selectFilters = (state:ReduxState) => state.hrmStaff.filters,
    selectSortBy = (state:ReduxState) => state.hrmStaff.sortBy,
    selectSortOrder = (state:ReduxState) => state.hrmStaff.sortOrder,
    selectLimit = (state:ReduxState) => state.hrmStaff.limit,
    selectPage = (state:ReduxState) => state.hrmStaff.page,
    equalityFn = (a,b) => JSON.stringify(a)===JSON.stringify(b),
    backendStaffFilterSelector = () => createSelector(
        selectFilterMode,
        selectFilters,
        (filterMode,filters) => ({filterMode,filters}),
        {memoizeOptions:{equalityCheck:equalityFn}}
    ),
    frontendStaffFilterSelector = () => createSelector(
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
    updateColumnVisibility,
} = hrmStaffSlice.actions
export type { IhrmStaff }
export { sliceName, createFieldValueSelector, frontendStaffFilterSelector, backendStaffFilterSelector }
export default hrmStaffSlice.reducer