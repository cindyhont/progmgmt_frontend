import { filterItem, IhrmBackendItem } from "./interfaces";
import constants from '../constants';
import { createSelector } from "@reduxjs/toolkit";

const 
    rearrangeDeptFilters = (filters:filterItem[]):filterItem[] => filters
        .filter(({field,operator,value})=>field!=='' || operator!=='' || value.trim()!=='')
        .map(({field,operator,value})=>({field,operator,value:value.trim().toLowerCase()}))
        .sort((a,b)=>a.value > b.value ? 1 : -1),

    staffHeaderArr = [
        {label:'staff_id',name:'ID',sx:{minWidth:'150px',py:1,pl:3.5}},
        {label:'first_name',name:'First Name',sx:{minWidth:'200px',py:1,pl:3.5}},
        {label:'last_name',name:'Last Name',sx:{minWidth:'250px',py:1,pl:3.5}},
        {label:'title',name:'Title',sx:{minWidth:'300px',py:1,pl:3.5}},
        {name:'Email Address',sx:{minWidth:'300px',py:1,pl:3.5}},
        {label:'department_id',name:'Department',sx:{minWidth:'200px',py:1,pl:3.5}},
        {label:'supervisor_id',name:'Supervisor',sx:{minWidth:'300px',py:1,pl:3.5}},
        ...constants.userRights.map(name=>({name,sx:{minWidth:'100px',py:1,textAlign:'center'}})),
        {label:'last_active_dt',name:'Last Time Active',sx:{minWidth:'150px',py:1}},
        {label:'date_registered_dt',name:'Date Registered',sx:{minWidth:'150px',py:1}},
        {label:'last_invite_dt',name:'Last Invitation Sent',sx:{minWidth:'150px',py:1}}
    ],
    getAllCheckboxSelector = () => createSelector(
        (res:IhrmBackendItem[]) => res,
        (res:IhrmBackendItem[]) => !!res.length,
        (res:IhrmBackendItem[],hasElement:boolean) => ({
            someChecked: hasElement && res.some(({selected})=>selected),
            allChecked: hasElement && res.every(({selected})=>selected),
        })
    ),
    staffRowsPerPageOptions = [10,20,50],
    deptRowsPerPageOptions = [5,10,20,50],
    Tables = {
        DEPARTMENTS:'departments',
        USER_DETAILS:'user_details'
    }

export {
    rearrangeDeptFilters,
    staffHeaderArr,
    getAllCheckboxSelector,
    staffRowsPerPageOptions,
    deptRowsPerPageOptions,
    Tables,
}