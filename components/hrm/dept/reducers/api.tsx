import { Tables } from "@components/hrm/functions";
import { IdeptFilterCollection, IhrmBackendItem, IhrmDeptFrontendItem } from "@components/hrm/interfaces";
import { Istore, ReduxState } from "@reducers";
import apiSlice, { fetchConfig, TagTypes } from "@reducers/api";
import { isSignedOut } from "@reducers/misc";
import { updatePage } from "./slice";

enum ListTypes {
    LIST = 'list'
}

const 
    PATH = '/pm-api',
    frontendDeptFilters = (state:Istore):IdeptFilterCollection => ({
        filterMode: state.hrmDept.filterMode,
        sortBy: state.hrmDept.sortBy,
        sortOrder: state.hrmDept.sortOrder,
        filters: state.hrmDept.filters,
        limit: state.hrmDept.limit,
        page: state.hrmDept.page
    }),
    backendDeptFilters = (state:Istore):IdeptFilterCollection => ({
        filterMode: state.hrmDept.filterMode,
        filters: state.hrmDept.filters,
    }),
    hrmDeptApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            getHrmDeptBackendIDs:build.query<IhrmBackendItem[],IdeptFilterCollection>({
                query: (filters) => fetchConfig(`${PATH}/hrm/dept/backend-ids`,'POST',filters),
                keepUnusedDataFor:0,
                transformResponse:(response:string[]) => !!response ? response.map(id=>({id,selected:false})) : [],
                providesTags:(result) => result ? [
                    ...result.map(({id})=>({type:TagTypes.Department_BACKEND,id})),
                    {type:TagTypes.Department_BACKEND,id:ListTypes.LIST}
                ] : [{type:TagTypes.Department_BACKEND,id:ListTypes.LIST}],
                async onQueryStarted(_, { dispatch, queryFulfilled }) {
                    try {
                        await queryFulfilled
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
            }),
            getHrmDeptFrontendList:build.query<IhrmDeptFrontendItem[],IdeptFilterCollection>({
                query: (filters) => fetchConfig(`${PATH}/hrm/dept/get-frontend`,'POST',filters),
                keepUnusedDataFor:0,
                providesTags:(result) => result ? [
                    ...result.map(({id})=>({type:TagTypes.Department_FRONTEND,id})),
                    {type:TagTypes.Department_FRONTEND,id:ListTypes.LIST}
                ] : [{type:TagTypes.Department_FRONTEND,id:ListTypes.LIST}],
                async onQueryStarted(_, { dispatch, queryFulfilled }) {
                    try {
                        await queryFulfilled
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
            }),
            addHrmDeptPassive:build.mutation<any,{id:string}>({
                async queryFn({id}, {dispatch,getState}, _, baseQuery){
                    const 
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state),
                        backendItems = hrmDeptApi.endpoints.getHrmDeptBackendIDs.select(backendFilter)(state).data

                    if (backendItems.findIndex(item=>item.id===id) !== -1) return {data:null}
                        
                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/hrm/dept/create-passive/${id}`,'POST',backendFilter))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const 
                            data = result.data as {internal_id:string;name:string;},
                            {internal_id,name} = data;
                        if (internal_id !== '' && name !== '') {
                            // add in backend list
                            dispatch(
                                hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs', backendFilter, (list) => {
                                    list.push({ id, selected:false })
                                })
                            )

                            // check if there is empty rows in frontend, add row if there is
                            const 
                                rowsPerPage = state.hrmDept.limit,
                                frontendFilter = frontendDeptFilters(state),
                                frontendList = hrmDeptApi.endpoints.getHrmDeptFrontendList.select(frontendFilter)(state).data

                            if (frontendList.length === rowsPerPage) return {data:null}
                            dispatch(
                                hrmDeptApi.util.updateQueryData('getHrmDeptFrontendList', frontendFilter, (list) => {
                                    list.push({ id, internal_id, name })
                                })
                            )
                        }
                    } catch {}
                    return {data:null}
                },
            }),
            addHrmDeptActive:build.mutation<any,{internal_id:string;name:string;filters:IdeptFilterCollection}>({
                query(args){
                    return fetchConfig(`${PATH}/hrm/dept/create-active`,'POST',args)
                },
                async onQueryStarted({internal_id,name,filters}, { dispatch, queryFulfilled, getState }){
                    try {
                        const {data:{inList,id}} = await queryFulfilled
                        if (!id || id==='' || !inList) return

                        dispatch(
                            hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs', filters, (list) => {
                                list.push({ id, selected:false })
                            })
                        )
                        const 
                            state = getState() as ReduxState,
                            frontendFilter = frontendDeptFilters(state),
                            frontendListLength = hrmDeptApi.endpoints.getHrmDeptFrontendList.select(frontendFilter)(state).data.length,
                            frontendRowsPerPage = state.hrmDept.limit
                        if (frontendListLength === frontendRowsPerPage) return
                        dispatch(
                            hrmDeptApi.util.updateQueryData('getHrmDeptFrontendList', frontendFilter, (list) => {
                                list.push({ id, internal_id, name })
                            })
                        )
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            deleteHrmDept:build.mutation<string[],{ids:string[];active:boolean;}>({
                async queryFn({ids,active}, {dispatch,getState}, _, baseQuery) {
                    // delete in DB here if active
                    if (active){
                        try {
                            const result = await baseQuery(fetchConfig(`${PATH}/hrm/delete`,'DELETE',{table:Tables.DEPARTMENTS,ids}))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:[]}
                            }
                            const 
                                data = result.data as {success:boolean;},
                                success = data.success
                            if (!success) return {data:[]}
                        } catch {}
                    }
                    
                    const 
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state),
                        backendIDs = hrmDeptApi.endpoints.getHrmDeptBackendIDs.select(backendFilter)(state).data.map(({id})=>id)

                    let backendIdx:number[] = []

                    ids.forEach(id => {
                        const beIdx = backendIDs.indexOf(id)
                        if (beIdx !== -1) backendIdx.push(beIdx)
                    })

                    backendIdx = backendIdx.sort((a,b)=>b > a ? 1 : -1)

                    if (backendIdx.length !== 0){
                        const 
                            rowsPerPage = state.hrmDept.limit,
                            currentPage = state.hrmDept.page

                        if (backendIDs.length - backendIdx.length <= (currentPage+1) * rowsPerPage){
                            // flip to last page if current page is behind last page of new version
                            dispatch(updatePage(Math.floor((backendIDs.length - backendIdx.length - 1) / rowsPerPage)))
                        }

                        dispatch(
                            hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs', backendFilter, (list) => {
                                backendIdx.forEach(idx => {
                                    list.splice(idx,1)
                                })
                            })
                        )
                    }
                    return { data: ids }
                },
                invalidatesTags:(_result,_err,{ids,active})=>active
                    ? [
                        {type:TagTypes.Department_FRONTEND,id:ListTypes.LIST},
                        ...ids.map(thisID => ({type:TagTypes.Staff_DEPARTMENT,id:thisID}))
                    ]
                    : ids.map(id=>[
                        {type:TagTypes.Department_FRONTEND,id},
                        {type:TagTypes.Staff_DEPARTMENT,id}
                    ]).flat()
            }),
            deleteHrmDeptActive:build.mutation<any,undefined>({
                queryFn(_, {dispatch,getState}) {
                    const 
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state),
                        selectedIDs = hrmDeptApi.endpoints.getHrmDeptBackendIDs.select(backendFilter)(state).data.filter(({selected})=>selected).map(({id})=>id)
                      
                    dispatch(hrmDeptApi.endpoints.deleteHrmDept.initiate({ ids:selectedIDs,active:true }))
                    return { data: null }
                },
            }),
            updateHrmDeptActive:build.mutation<any,{id:string;field:'internal_id'|'name';value:string;}>({
                query({id,field,value}){
                    return fetchConfig(`${PATH}/hrm/update-single-field/${Tables.DEPARTMENTS}`,'PATCH',{id,field,value})
                },
                async onQueryStarted({id,field,value}, { dispatch, getState, queryFulfilled }) {
                    const 
                        frontendFilter = frontendDeptFilters(getState() as ReduxState),
                        patchResult = dispatch(
                            hrmDeptApi.util.updateQueryData('getHrmDeptFrontendList', frontendFilter, (list) => {
                                const item = list.find(e=>e.id===id)
                                if (!!item) item[field] = value
                            })
                        )
                    try {
                        const 
                            result = await queryFulfilled,
                            data = result.data as {success:boolean;},
                            {success} = data
                        if (!success) patchResult.undo()
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
                invalidatesTags:(_result,_error,{id}) => [{type:TagTypes.Staff_DEPARTMENT,id}]
            }),
            updateHrmDeptPassive:build.mutation<any,{id:string;field:'internal_id'|'name';value:string;}>({
                queryFn({id,field,value}, {dispatch,getState}){
                    if (field!=='internal_id' && field!=='name') return {data:null}

                    const frontendFilter = frontendDeptFilters(getState() as ReduxState)
                    dispatch(
                        hrmDeptApi.util.updateQueryData('getHrmDeptFrontendList', frontendFilter, (list) => {
                            const item = list.find(e=>e.id===id)
                            if (!!item) item[field] = value
                        })
                    )
                    return {data:null}
                },
                invalidatesTags:(_result,_error,{id}) => [{type:TagTypes.Staff_DEPARTMENT,id}]
            }),
            hrmDeptSelectAll:build.mutation<any,void>({
                queryFn(_arg,{dispatch,getState},_extra,_baseQuery){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state),
                        backendIDs = hrmDeptApi.endpoints.getHrmDeptBackendIDs.select(backendFilter)(state).data,
                        totalCount = backendIDs.length,
                        allChecked = backendIDs.every(({selected})=>selected)

                    dispatch(
                        hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs',backendFilter,(list)=>{
                            for (let i=0; i<totalCount; i++){
                                list[i].selected = !allChecked
                            }
                        })
                    )

                    return {data:null}
                }
            }),
            hrmDeptDeselectAll:build.mutation<any,void>({
                queryFn(_arg,{dispatch,getState},_extra,_baseQuery){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state),
                        totalCount = hrmDeptApi.endpoints.getHrmDeptBackendIDs.select(backendFilter)(state).data.length

                    dispatch(
                        hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs',backendFilter,(list)=>{
                            for (let i=0; i<totalCount; i++){
                                list[i].selected = false
                            }
                        })
                    )

                    return {data:null}
                }
            }),
            updateHrmDeptRowCheckbox:build.mutation<any,string>({
                queryFn(id,{dispatch,getState}){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendDeptFilters(state)
                    dispatch(
                        hrmDeptApi.util.updateQueryData('getHrmDeptBackendIDs',backendFilter,(list)=>{
                            const item = list.find(e=>e.id===id)
                            if (!!item) item.selected = !item.selected
                        })
                    )

                    return {data:null}
                }
            }),
        }),
    })

export const {
    useGetHrmDeptBackendIDsQuery,
    useGetHrmDeptFrontendListQuery,
    useAddHrmDeptActiveMutation,
    useDeleteHrmDeptActiveMutation,
    useUpdateHrmDeptActiveMutation,
    useHrmDeptSelectAllMutation,
    useHrmDeptDeselectAllMutation,
    useUpdateHrmDeptRowCheckboxMutation,
} = hrmDeptApi
export default hrmDeptApi