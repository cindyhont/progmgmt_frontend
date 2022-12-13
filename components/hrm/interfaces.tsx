export type ThrmDeptColumn = "internal_id" | "name"
export type ThrmDeptFilterOperators = ""|"equals"|"contains"|"start_with"|"end_with"
export type ThrmStaffFilterOperators = ThrmDeptFilterOperators | "includes"|"excludes"|"can"|"cannot"

export interface filterItem{
    id?:string;
    field:string;
    operator:ThrmStaffFilterOperators
    value?:string;
    values?:string[]|number[];
}

export interface IhrmBackendItem {
    id:string;
    selected:boolean;
}

export interface IwsMessage {
    id?:string;
    ids?:string[];
    table:'departments'|'user_details';
    action:'create'|'update'|'delete';
    field?:string;
    value?:string|number;
    values?:string[]|number[];
}

export interface IdeptFilterCollection{
    filterMode: "AND" | "OR";
    sortBy?: "" | ThrmDeptColumn;
    sortOrder?: "" | "asc" | "desc";
    filters: filterItem[];
    limit?: number;
    page?: number;
}

export interface IhrmDeptFrontendItem{
    id:string;
    internal_id:string;
    name:string;
}

export interface IhrmDept{
    page:number;
    limit:number;
    filterMode:'AND'|'OR';
    filters:filterItem[];
    sortBy:''|ThrmDeptColumn;
    sortOrder:''|'asc'|'desc';
}

export type ThrmStaffColumns = ''
    | "staff_id" 
    | "first_name" 
    | "last_name" 
    | "title"
    | 'department_id' 
    | 'supervisor_id'
    | 'user_right'
    | 'email'
    |'last_invite_dt'
    |'date_registered_dt'
    |'last_active_dt'

export interface IstaffFilterCollection{
    filterMode: "AND" | "OR";
    sortBy?: "" | ThrmStaffColumns;
    sortOrder?: "" | "asc" | "desc";
    filters: filterItem[];
    limit?: number;
    page?: number;
}

export interface IhrmStaffFrontendItem{
    id:string;
    staff_id:string;
    first_name:string;
    last_name:string;
    title:string;
    department_id:string;
    supervisor_id:string;
    user_right:number;
    email:string;
    last_invite_dt:number;
    date_registered_dt:number;
    last_active_dt:number;
}

export interface IhrmStaff{
    page:number;
    limit:number;
    filterMode:'AND'|'OR';
    filters:filterItem[];
    sortBy:"" | ThrmStaffColumns;
    sortOrder:''|'asc'|'desc';
    columnVisibility:number;
}