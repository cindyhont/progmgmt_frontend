import { ThrmStaffColumns, ThrmStaffFilterOperators } from '@components/hrm/interfaces';
import { NIL as uuidNIL } from 'uuid'

const StaffFilterTypes = {
    ADD: 'add' as 'add',
    DELETE: 'delete' as 'delete',
    FIELD: 'field' as 'field',
    OPERATOR: 'operator' as 'operator',
    STRING_VALUE: 'string_value' as 'string_value',
    USER_RIGHTS: 'user_rights' as 'user_rights',
    DEPARTMENT: 'department' as 'department',
    SUPERVISOR: 'supervisor' as 'supervisor',
}

export interface IstaffFilterItem {
    id:string;
    field:ThrmStaffColumns;
    operator:ThrmStaffFilterOperators;
    value:string;
    department_ids:{label:string;id:string;}[];
    supervisor_ids:{label:string;id:string}[];
    user_rights:{label:string;value:number}[];
}

export interface IhrmStaffFilterRdcr {
    filters:IstaffFilterItem[]
}

export interface IaddAction {
    type:typeof StaffFilterTypes.ADD;
    payload:string;
}

export interface IdeleteAction {
    type:typeof StaffFilterTypes.DELETE;
    payload:string;
}

export interface IfieldAction {
    type:typeof StaffFilterTypes.FIELD;
    payload:{
        id:string;
        field:ThrmStaffColumns;
    }
}

export interface IoperatorAction {
    type:typeof StaffFilterTypes.OPERATOR;
    payload:{
        id:string;
        operator:ThrmStaffFilterOperators;
    }
}

export interface IvalueAction {
    type:typeof StaffFilterTypes.STRING_VALUE;
    payload:{
        id:string;
        value:string;
    }
}

export interface IuserRightsAction {
    type:typeof StaffFilterTypes.USER_RIGHTS;
    payload:{
        id:string;
        user_rights:{
            label:string;
            value:number;
        }[]
    }
}

export interface IdepartmentsAction {
    type:typeof StaffFilterTypes.DEPARTMENT;
    payload:{
        id:string;
        departments:{
            label:string;
            id:string;
        }[]
    }
}

export interface IsupervisorAction {
    type: typeof StaffFilterTypes.SUPERVISOR;
    payload:{
        id:string;
        supervisors:{
            label:string;
            id:string;
        }[]
    }
}

export type Iactions = IaddAction
    | IdeleteAction
    | IfieldAction
    | IoperatorAction
    | IvalueAction
    | IuserRightsAction
    | IdepartmentsAction
    | IsupervisorAction

const
    firstItem:IstaffFilterItem = {
        id:uuidNIL,
        field:'staff_id',
        operator:'contains',
        value:'',
        department_ids:[],
        supervisor_ids:[],
        user_rights:[],
    },
    initialState:IhrmStaffFilterRdcr = {
        filters:[firstItem]
    },
    filterReducer = (state:IhrmStaffFilterRdcr,{type,payload}:Iactions) => {
        switch (type) {
            case StaffFilterTypes.ADD:
                return {
                    ...state,
                    filters:[
                        ...state.filters,{
                            id:payload,
                            field:'',
                            operator:'',
                            value:'',
                            department_ids:[],
                            supervisor_ids:[],
                            user_rights:[],
                        } as IstaffFilterItem
                    ]
                }
            case StaffFilterTypes.DELETE:
                return {
                    ...state,
                    filters:state.filters.filter(({id})=>id !== payload)
                }
            case StaffFilterTypes.FIELD:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {field:payload.field})}))
                }
            case StaffFilterTypes.OPERATOR:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {operator:payload.operator})}))
                }
            case StaffFilterTypes.STRING_VALUE:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {value:payload.value})}))
                }
            case StaffFilterTypes.USER_RIGHTS:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {user_rights:payload.user_rights})}))
                }
            case StaffFilterTypes.DEPARTMENT:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {department_ids:payload.departments})}))
                }
            case StaffFilterTypes.SUPERVISOR:
                return {
                    ...state,
                    filters:state.filters.map(f=>({...f,...(f.id===payload.id && {supervisor_ids:payload.supervisors})}))
                }
            default: return state
        }
    },
    addFilterAction = (payload:string) => ({
        type:StaffFilterTypes.ADD,
        payload
    }),
    deleteFilterAction = (payload:string) => ({
        type:StaffFilterTypes.DELETE,
        payload
    }),
    updateField = (payload:{id:string;field:ThrmStaffColumns;}) => ({
        type:StaffFilterTypes.FIELD,
        payload
    }),
    updateOperator = (payload:{id:string;operator:ThrmStaffFilterOperators;}) => ({
        type:StaffFilterTypes.OPERATOR,
        payload
    }),
    updateValue = (payload:{id:string;value:string;}) => ({
        type:StaffFilterTypes.STRING_VALUE,
        payload
    }),
    updateUserRights = (payload:{
        id:string;
        user_rights:{
            label:string;
            value:number;
        }[]
    }) => ({
        type:StaffFilterTypes.USER_RIGHTS,
        payload
    }),
    updateDepartments = (
        payload:{
            id:string;
            departments:{
                label:string;
                id:string;
            }[]
        }
    ) => ({
        type:StaffFilterTypes.DEPARTMENT,
        payload
    }),
    updateSupervisors = (
        payload:{
            id:string;
            supervisors:{
                label:string;
                id:string;
            }[]
        }
    ) => ({
        type:StaffFilterTypes.SUPERVISOR,
        payload
    })

export {
    initialState,
    filterReducer,
    addFilterAction,
    deleteFilterAction,
    updateField,
    updateOperator,
    updateValue,
    updateUserRights,
    updateDepartments,
    updateSupervisors,
}