import { Tables } from "@components/hrm/functions";
import { IhrmBackendItem, IhrmStaffFrontendItem, IstaffFilterCollection, ThrmStaffColumns } from "@components/hrm/interfaces";
import { Istore, ReduxState } from "@reducers";
import apiSlice, { fetchConfig, TagTypes } from "@reducers/api";
import { isSignedOut } from "@reducers/misc";
import { updatePage } from "./slice";

enum ListTypes {
    LIST = 'list'
}

const 
    PATH = '/api',
    frontendStaffFilters = (state:Istore):IstaffFilterCollection => ({
        filterMode: state.hrmStaff.filterMode,
        sortBy: state.hrmStaff.sortBy,
        sortOrder: state.hrmStaff.sortOrder,
        filters: state.hrmStaff.filters,
        limit: state.hrmStaff.limit,
        page: state.hrmStaff.page
    }),
    backendStaffFilters = (state:Istore):IstaffFilterCollection => ({
        filterMode: state.hrmStaff.filterMode,
        filters: state.hrmStaff.filters,
    }),
    hrmStaffApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            getHrmStaffBackendIDs:build.query<IhrmBackendItem[],IstaffFilterCollection>({
                query:(filters) => fetchConfig(`${PATH}/hrm/staff/backend-ids`,'POST',filters),
                keepUnusedDataFor:0,
                transformResponse:(response:string[]) => !!response ? response.map(id=>({id,selected:false})) : [],
                providesTags:(result) => result ? [
                    ...result.map(({id})=>({type:TagTypes.Staff_BACKEND,id})),
                    {type:TagTypes.Staff_BACKEND,id:ListTypes.LIST}
                ] : [{type:TagTypes.Staff_BACKEND,id:ListTypes.LIST}],
                async onQueryStarted(_, { dispatch, queryFulfilled }) {
                    try {
                        await queryFulfilled
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
            }),
            getHrmStaffFrontendList:build.query<IhrmStaffFrontendItem[],IstaffFilterCollection>({
                query:(filters) => fetchConfig(`${PATH}/hrm/staff/get-frontend`,'POST',filters),
                keepUnusedDataFor:0,
                providesTags:(result) => result ? [
                    ...result.map(({id})=>({type:TagTypes.Staff_FRONTEND,id})),
                    {type:TagTypes.Staff_FRONTEND,id:ListTypes.LIST}
                ] : [{type:TagTypes.Staff_FRONTEND,id:ListTypes.LIST}],
                async onQueryStarted(_, { dispatch, queryFulfilled }) {
                    try {
                        await queryFulfilled
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
            }),
            getSupervisorOrDepartment:build.query<{name:string},{id:string;item:'supervisor'|'department'}>({
                async queryFn({id,item},{dispatch},_,baseQuery){
                    if (id==='') return {data:{name:''}}
                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/hrm/staff/get-${item}/${id}`,'GET'))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {name:string}
                        return {data}
                    } catch {}
                    return {data:{name:''}}
                },
                keepUnusedDataFor:0,
                providesTags:(_result,_error,{id,item}) => [{
                    type:item==='supervisor' ? TagTypes.Staff_SUPERVISOR : TagTypes.Staff_DEPARTMENT,
                    id
                }],
            }),
            addHrmStaffActive:build.mutation<any,{
                staffID:string;
                firstName:string;
                lastName:string;
                title:string;
                departmentID:string;
                supervisorID:string;
                userRight:number;
                email:string;
                filters:IstaffFilterCollection;
            }>({
                query(args){
                    return fetchConfig(`${PATH}/hrm/staff/create-active`,'POST',args)
                },
                async onQueryStarted({
                    staffID,
                    firstName,
                    lastName,
                    title,
                    departmentID,
                    supervisorID,
                    userRight,
                    email,
                    filters,
                }, { dispatch, queryFulfilled, getState }){
                    try {
                        const 
                            result = await queryFulfilled,
                            {inList,id} = result.data as {inList:string;id:string;}
                        if (!id || id==='' || !inList) return

                        dispatch(
                            hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs', filters, (list) => {
                                list.push({ id, selected:false })
                            })
                        )
                        const
                            state = getState() as ReduxState,
                            frontendFilter = frontendStaffFilters(state),
                            frontendListLength = hrmStaffApi.endpoints.getHrmStaffFrontendList.select(frontendFilter)(state).data.length,
                            frontendRowsPerPage = (getState() as ReduxState).hrmStaff.limit
                        if (frontendListLength === frontendRowsPerPage) return
                        dispatch(
                            hrmStaffApi.util.updateQueryData('getHrmStaffFrontendList', frontendFilter, (list) => {
                                list.push({
                                    id,
                                    staff_id:staffID,
                                    first_name:firstName,
                                    last_name:lastName,
                                    title,
                                    department_id:departmentID,
                                    supervisor_id:supervisorID,
                                    user_right:userRight,
                                    email,
                                    last_invite_dt:0,
                                    date_registered_dt:0,
                                    last_active_dt:0,
                                })
                            })
                        )
                    } catch (error) {
                        if (error.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            addHrmStaffPassive:build.mutation<any,{id:string}>({
                async queryFn({id}, {dispatch,getState}, _, baseQuery){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state)

                    if (hrmStaffApi.endpoints.getHrmStaffBackendIDs.select(backendFilter)(state).data.findIndex(item=>item.id===id) !== -1) return {data:null}

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/hrm/staff/create-passive/${id}`,'POST',backendFilter))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const 
                            data = result.data as IhrmStaffFrontendItem,
                            {staff_id} = data;
                        
                        if (staff_id !== '') {
                            // add in backend list
                            dispatch(
                                hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs', backendFilter, (list) => {
                                    list.push({ id, selected:false })
                                })
                            )

                            // check if there is empty rows in frontend, add row if there is
                            const 
                                rowsPerPage = state.hrmStaff.limit,
                                frontendFilter = frontendStaffFilters(state),
                                frontendListLength = hrmStaffApi.endpoints.getHrmStaffFrontendList.select(frontendFilter)(state).data.length

                            if (frontendListLength === rowsPerPage) return {data:null}
                            
                            dispatch(
                                hrmStaffApi.util.updateQueryData('getHrmStaffFrontendList', frontendFilter, (list) => {
                                    list.push(data)
                                })
                            )
                        }
                    } catch {}
                    return {data:null}
                },
            }),
            updateHrmStaffActive:build.mutation<any,{
                id:string;
                field:ThrmStaffColumns;
                value:string|number;
            }>({
                query({id,field,value}){
                    return fetchConfig(`${PATH}/hrm/update-single-field/${Tables.USER_DETAILS}`,'PATCH',{id,field,value})
                },
                async onQueryStarted({id,field,value}, { dispatch, getState, queryFulfilled }) {
                    const 
                        frontendFilter = frontendStaffFilters(getState() as ReduxState),
                        patchResult = dispatch(
                            hrmStaffApi.util.updateQueryData('getHrmStaffFrontendList', frontendFilter, (list) => {
                                const item = list.find(e=>e.id===id)
                                if (!!item) item[field] = value
                            })
                        )
                    try {
                        const 
                            result = await queryFulfilled,
                            {success} = result.data as {success:boolean;}
                        if (!success) patchResult.undo()
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                },
                invalidatesTags:(_result,_err,{id})=>[{type:TagTypes.Staff_SUPERVISOR,id}]
            }),
            updateHrmStaffPassive:build.mutation<any,{id:string;field:ThrmStaffColumns;value:string;}>({
                queryFn({id,field,value}, {dispatch,getState}){
                    const frontendFilter = frontendStaffFilters(getState() as ReduxState)
                    dispatch(
                        hrmStaffApi.util.updateQueryData('getHrmStaffFrontendList', frontendFilter, (list) => {
                            const item = list.find(e=>e.id===id)
                            if (!!item && item.hasOwnProperty(field)) item[field] = value
                        })
                    )
                    return {data:null}
                },
                invalidatesTags:(_result,_error,{id}) => [{type:TagTypes.Staff_SUPERVISOR,id}]
            }),
            deleteHrmStaff:build.mutation<string[],{ids:string[];active:boolean;}>({
                async queryFn({ids,active}, {dispatch,getState}, _, baseQuery) {
                    // delete in DB here if active
                    if (active){
                        try {
                            const result = await baseQuery(fetchConfig(`${PATH}/hrm/delete`,'DELETE',{table:Tables.USER_DETAILS,ids}))
                            if (result?.error?.status===401){
                                dispatch(isSignedOut())
                                return {data:null}
                            }
                            const {success} = result.data as {success:boolean;}
                            if (!success) return {data:null}
                        } catch {}
                    }
                    
                    const 
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state),
                        backendIDs = hrmStaffApi.endpoints.getHrmStaffBackendIDs.select(backendFilter)(state).data.map(({id})=>id)

                    let backendIdx:number[] = []

                    ids.forEach(id => {
                        const beIdx = backendIDs.indexOf(id)
                        if (beIdx !== -1) backendIdx.push(beIdx)
                    })

                    backendIdx = backendIdx.sort((a,b)=>b > a ? 1 : -1)

                    if (backendIdx.length !== 0){
                        const 
                            rowsPerPage = state.hrmStaff.limit,
                            currentPage = state.hrmStaff.page

                        if (backendIDs.length - backendIdx.length <= (currentPage+1) * rowsPerPage){
                            // flip to last page if current page is behind last page of new version
                            dispatch(updatePage(Math.floor((backendIDs.length - backendIdx.length - 1) / rowsPerPage)))
                        }

                        dispatch(
                            hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs', backendFilter, (list) => {
                                backendIdx.forEach(idx => {
                                    list.splice(idx,1)
                                })
                            })
                        )
                    }
                    return { data: ids }
                },
                invalidatesTags:(_result,_err,{ids,active})=>active
                    ? [{type:TagTypes.Staff_FRONTEND,id:ListTypes.LIST},...ids.map(id=>({type:TagTypes.Staff_SUPERVISOR,id}))]
                    : ids.map(id=>[{type:TagTypes.Staff_FRONTEND,id},{type:TagTypes.Staff_SUPERVISOR,id}]).flat()
            }),
            deleteHrmStaffActive:build.mutation<any,undefined>({
                queryFn(_, {dispatch,getState}) {
                    const 
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state),
                        selectedIDs = hrmStaffApi.endpoints.getHrmStaffBackendIDs.select(backendFilter)(state).data.filter(({selected})=>selected).map(({id})=>id)
                      
                    dispatch(hrmStaffApi.endpoints.deleteHrmStaff.initiate({ ids:selectedIDs,active:true }))
                    return { data: null }
                },
            }),
            hrmStaffSelectAll:build.mutation<any,void>({
                queryFn(_arg,{dispatch,getState},_extra,_baseQuery){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state),
                        backendIDs = hrmStaffApi.endpoints.getHrmStaffBackendIDs.select(backendFilter)(state).data,
                        totalCount = backendIDs.length,
                        allChecked = backendIDs.every(({selected})=>selected)

                    dispatch(
                        hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs',backendFilter,(list)=>{
                            for (let i=0; i<totalCount; i++){
                                list[i].selected = !allChecked
                            }
                        })
                    )

                    return {data:null}
                }
            }),
            hrmStaffDeselectAll:build.mutation<any,void>({
                queryFn(_arg,{dispatch,getState},_extra,_baseQuery){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state),
                        totalCount = hrmStaffApi.endpoints.getHrmStaffBackendIDs.select(backendFilter)(state).data.length

                    dispatch(
                        hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs',backendFilter,(list)=>{
                            for (let i=0; i<totalCount; i++){
                                list[i].selected = false
                            }
                        })
                    )

                    return {data:null}
                }
            }),
            updateHrmStaffRowCheckbox:build.mutation<any,string>({
                queryFn(id,{dispatch,getState}){
                    const
                        state = getState() as ReduxState,
                        backendFilter = backendStaffFilters(state)
                    dispatch(
                        hrmStaffApi.util.updateQueryData('getHrmStaffBackendIDs',backendFilter,(list)=>{
                            const item = list.find(e=>e.id===id)
                            if (!!item) item.selected = !item.selected
                        })
                    )

                    return {data:null}
                }
            }),
        })
    })

export default hrmStaffApi
export const {
    useGetHrmStaffBackendIDsQuery,
    useGetHrmStaffFrontendListQuery,
    useGetSupervisorOrDepartmentQuery,
    useAddHrmStaffActiveMutation,
    useUpdateHrmStaffActiveMutation,
    useDeleteHrmStaffActiveMutation,
    useHrmStaffSelectAllMutation,
    useHrmStaffDeselectAllMutation,
    useUpdateHrmStaffRowCheckboxMutation,
} = hrmStaffApi