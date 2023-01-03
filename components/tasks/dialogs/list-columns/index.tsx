import { taskCustomFieldTypesSelector, taskEditMultipleFields, taskFieldSelector } from "@components/tasks/reducers/slice";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId, Update } from "@reduxjs/toolkit";
import React, { Dispatch, memo, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import FormGroup from '@mui/material/FormGroup'
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { toggleDialogAction } from "@components/tasks/reducers/dialog-ctxmenu-status";
import { addAction, deleteAction, Iaction, reducer, setAllAction } from "./reducer";
import { useStore } from "react-redux";
import { DialogCtxMenuDispatchContext } from "@components/tasks/contexts";
import IndexedDB from "@indexeddb";
import { getSortedFieldIDs } from "@indexeddb/functions";
import { LayoutOrderDispatchContext } from "@pages";
import { TaskField } from "@components/tasks/interfaces";
import useNarrowBody from "hooks/theme/narrow-body";

const
    ListColumnDialog = memo(({open}:{open:boolean}) => {
        const
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            idb = useRef<IndexedDB>(),
            narrowBody = useNarrowBody(),
            fieldsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectAll(state),
                (state:ReduxState)=>state,
                (fields:TaskField[],state:ReduxState)=>{
                    let result:{id:EntityId;label:string}[] = []
                    const len = fields.length

                    for (let i=0; i<len; i++){
                        const 
                            field = fields[i],
                            {fieldType} = field,
                            typeObj = taskCustomFieldTypesSelector.selectById(state,fieldType)
                        if (!!typeObj && typeObj.listView) result.push({id:field.id,label:field.fieldName})
                    }
                    return result
                }
            ),[]),
            fields = useAppSelector(state => fieldsSelector(state)),
            onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'editListViewColumns',open:false})),
            [state,listColumnDispatch] = useReducer(reducer,{fields:[]}),
            store = useStore(),
            dispatch = useAppDispatch(),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            onSubmit = () => {
                onClose()

                const 
                    s = store.getState() as ReduxState,
                    fields = taskFieldSelector.selectAll(s),
                    fieldCount = fields.length,
                    key = narrowBody ? 'listNarrowScreenOrder' : 'listWideScreenOrder',
                    initialFieldIDs = getSortedFieldIDs(fields,key),
                    newFieldIDs = [
                        ...initialFieldIDs.filter(e=>state.fields.includes(e)),
                        ...state.fields.filter(e=>!initialFieldIDs.includes(e))
                    ]

                let updates:Update<TaskField>[] = []

                for (let i=0; i<fieldCount; i++){
                    const 
                        field = fields[i],
                        {id} = field,
                        newPos = newFieldIDs.indexOf(id)
                    if (field[key]!==newPos) updates.push({id,changes:{[key]:newPos}})
                }

                if (!updates.length) return

                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
                dispatch(taskEditMultipleFields(updates))
                layoutOrderDispatch({
                    payload:fields.map((
                        {
                            id,
                            listWideScreenOrder,
                            listNarrowScreenOrder,
                            detailsSidebarOrder,
                            detailsSidebarExpand,
                        }
                    )=>({
                        id,
                        listWideScreenOrder:narrowBody ? listWideScreenOrder : newFieldIDs.indexOf(id),
                        listNarrowScreenOrder:narrowBody ? newFieldIDs.indexOf(id) : listNarrowScreenOrder,
                        detailsSidebarOrder,
                        detailsSidebarExpand,
                    }))
                })
            }

        useEffect(()=>{
            const s = store.getState() as ReduxState
            idb.current = new IndexedDB(s.misc.uid.toString(),1)
        },[])

        useEffect(()=>{
            if (open) {
                const s = store.getState() as ReduxState
                listColumnDispatch(setAllAction(taskFieldSelector.selectAll(s).filter(e=>e[narrowBody ? 'listNarrowScreenOrder' : 'listWideScreenOrder']!==-1).map(({id})=>id)))
            }
        },[open,narrowBody])

        return (
            <Dialog open={open} onClose={onClose} keepMounted>
                <DialogTitle>Fields in List View</DialogTitle>
                <DialogContent>
                    <FormGroup>
                        {fields.map(({id,label})=>(
                            <ListColumnOption {...{id,label,checked:state.fields.includes(id),listColumnDispatch}} key={id} />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button variant='contained' onClick={onSubmit}>Update</Button>
                </DialogActions>
            </Dialog>
        )
    }),
    ListColumnOption = memo((
        {
            id,
            label,
            checked,
            listColumnDispatch
        }:{
            id:EntityId;
            label:string;
            checked:boolean;
            listColumnDispatch:Dispatch<Iaction>;
        }
    ) => {
        const onClick = () => listColumnDispatch(checked ? deleteAction(id) : addAction(id))
        return (
            <FormControlLabel 
                label={label}
                control={<Checkbox checked={checked} disabled={id==='name'} onClick={onClick} />}
            />
        )
    })
ListColumnOption.displayName = 'ListColumnOption'
ListColumnDialog.displayName = 'ListColumnDialog'
export default ListColumnDialog