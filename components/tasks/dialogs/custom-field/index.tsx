import React, { ChangeEvent, createContext, Dispatch, FormEvent, KeyboardEvent, memo, useCallback, useContext, useEffect, useReducer, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { toggleDialogAction } from '@components/tasks/reducers/dialog-ctxmenu-status';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { taskCustomFieldTypesSelector, taskFieldSelector } from '@components/tasks/reducers/slice';
import { EntityId } from '@reduxjs/toolkit';
import { editDefaultValueAction, editNameAction, editTypeIdAction, Iaction, IcustomField, initialState, reducer, resetAction } from './reducer';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import ShortTextField from './short-text-field';
import NumberField from './number-field';
import LinkField from './link-field';
import CheckboxField from './checkbox-field';
import DropdownField from './dropdown-field';
import TagsField from './tags-field';
import DateField from './date-field';
import SingleUserField from './single-user-field';
import PeopleField from './people-field';
import DialogActions from '@mui/material/DialogActions';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material';
import taskApi from '@components/tasks/reducers/api';
import { useStore } from 'react-redux';
import { DialogCtxMenuDispatchContext } from '@components/tasks/contexts';
import IndexedDB from '@indexeddb';
import useNarrowBody from 'hooks/theme/narrow-body';

const 
    Context = createContext<{customFieldDispatch:Dispatch<Iaction>}>({customFieldDispatch:()=>{}}),
    AddCustomFieldDialog = memo(({open}:{open:boolean}) => {
        const
            dispatch = useAppDispatch(),
            idb = useRef<IndexedDB>(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClose = useCallback(()=>dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'addCustomField',open:false})),[]),
            [state,customFieldDispatch] = useReducer(reducer,initialState),
            store = useStore(),
            closeOnClick = () => {
                onClose()
                setTimeout(()=>customFieldDispatch(resetAction(initialState)),200)
            },
            narrowBody = useNarrowBody(),
            onSubmit = (e:FormEvent) => {
                e.preventDefault()
                closeOnClick()

                const 
                    fieldID = uuidv4(),
                    s = store.getState() as ReduxState,
                    existingFields = taskFieldSelector.selectAll(s)
                dispatch(taskApi.endpoints.taskAddCustomField.initiate({f:JSON.parse(JSON.stringify(state)),fieldID,wideScreen:!narrowBody}))

                idb.current.addMulitpleEntries(
                    idb.current.storeNames.taskFields,
                    [{
                        id:fieldID,
                        listWideScreenOrder:Math.max(...existingFields.map(e=>e.listWideScreenOrder))+1,
                        listNarrowScreenOrder:narrowBody ? Math.max(...existingFields.map(e=>e.listNarrowScreenOrder))+1 : -1,
                        detailsSidebarOrder:Math.max(...existingFields.map(e=>e.detailsSidebarOrder))+1,
                        detailsSidebarExpand:true,
                    }]
                )
            }

        useEffect(()=>{
            const s = store.getState() as ReduxState
            idb.current = new IndexedDB(s.misc.uid.toString(),1)
        },[])
            
        return (
            <CustomFieldDialog {...{
                open,
                onClose,
                customFieldDispatch,
                state,
                closeOnClick,
                onSubmit,
                isAdding:true,
            }} />
        )
    }),
    EditCustomFieldDialog = memo(({open}:{open:boolean}) => {
        const
            dispatch = useAppDispatch(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClose = useCallback(()=>dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'editCustomField',open:false})),[]),
            fieldID = useAppSelector(state=>state.taskMgmt.ctxMenuFieldID),
            [state,customFieldDispatch] = useReducer(reducer,initialState),
            store = useStore(),
            updateState = () => {
                if (!fieldID || !open) return
                const 
                    s = store.getState() as ReduxState,
                    customFieldObj = taskFieldSelector.selectById(s,fieldID) //taskCustomFieldSelector.selectById(s,fieldID)
                if (!customFieldObj) return
                const obj = {
                    name:customFieldObj.fieldName,
                    fieldType:customFieldObj.fieldType,
                    defaultValues:{[customFieldObj.fieldType]:customFieldObj.details.default},
                    options:{[customFieldObj.fieldType]:customFieldObj.details.options || []}
                }
                customFieldDispatch(resetAction(obj))
            },
            onSubmit = (e:FormEvent) => {
                e.preventDefault()
                dispatch(taskApi.endpoints.editCustomField.initiate({id:fieldID,f:state}))
                onClose()
            }

        useEffect(()=>{
            updateState()
        },[fieldID,open])

        

        return (
            <CustomFieldDialog {...{
                open,
                onClose,
                customFieldDispatch,
                state,
                closeOnClick:onClose,
                onSubmit,
                isAdding:false,
            }} />
        )
    }),
    CustomFieldDialog = (
        {
            open,
            onClose,
            customFieldDispatch,
            state,
            closeOnClick,
            onSubmit,
            isAdding,
        }:{
            open:boolean;
            onClose:()=>void;
            customFieldDispatch:Dispatch<Iaction>;
            state:IcustomField;
            closeOnClick:()=>void;
            onSubmit:(e:FormEvent)=>void;
            isAdding:boolean;
        }
    ) => {
        const 
            theme = useTheme(),
            submitBtnRef = useRef<HTMLInputElement>(),
            submitBtnOnClick = () => submitBtnRef.current.click(),
            [typeSelectOpen,setTypeSelectOpen] = useState(false),
            openTypeSelect = useCallback(()=>setTypeSelectOpen(true),[]),
            closeTypeSelect = useCallback(()=>setTypeSelectOpen(false),[])

        return (
            <Dialog open={open} onClose={onClose} keepMounted disableEnforceFocus={true}>
                <DialogTitle>{`${isAdding ? 'Add' : 'Edit'} Custom Field`}</DialogTitle>
                <DialogContent>
                    <Stack
                        direction='column'
                        spacing={2}
                        sx={{mt:1}}
                        component='form'
                        onSubmit={onSubmit}
                    >
                        <Context.Provider value={{customFieldDispatch}}>
                            <NameField {...{name:state.name,openTypeSelect,open}} />
                            <TypeField {...{
                                value:state.fieldType,
                                open:typeSelectOpen,
                                openTypeSelect,
                                closeTypeSelect,
                                disabled:!isAdding
                            }} />
                            {!!state.fieldType && <DefaultValueComponentDivert {...{state}} />}
                        </Context.Provider>
                        <input type='submit' hidden ref={submitBtnRef} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Grid
                        container
                        direction='row'
                        sx={{justifyContent:'space-between'}}
                    >
                        <Button onClick={closeOnClick} sx={{color:theme.palette.grey[500]}}>Close</Button>
                        <Button variant='outlined' onClick={submitBtnOnClick}>Submit</Button>
                    </Grid>
                </DialogActions>
            </Dialog>
        )
    },
    NameField = memo((
        {
            name,
            openTypeSelect,
            open
        }:{
            name:string;
            openTypeSelect:()=>void;
            open:boolean;
        }
    )=>{
        const 
            {customFieldDispatch} = useContext(Context),
            onChange = (e:ChangeEvent<HTMLInputElement>) => customFieldDispatch(editNameAction(e.target.value)),
            onKeyDown = (e:KeyboardEvent) => {
                if (e.key==='Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey) openTypeSelect()
            },
            ref = useRef<HTMLInputElement>()

        useEffect(()=>{
            ref.current.focus()
        },[open])

        return (
            <TextField 
                inputRef={ref}
                required
                fullWidth
                label='Field Name'
                inputProps={{maxLength:100}}
                value={name}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
        )
    }),
    TypeField = memo((
        {
            value,
            open,
            openTypeSelect,
            closeTypeSelect,
            disabled
        }:{
            value:EntityId;
            open:boolean;
            openTypeSelect:()=>void;
            closeTypeSelect:()=>void;
            disabled:boolean;
        }
    ) => {
        const 
            {customFieldDispatch} = useContext(Context),
            options = useAppSelector(state => taskCustomFieldTypesSelector.selectAll(state).filter(({customField})=>customField).map(({id,typeName})=>({id,typeName}))),
            handleChange = (e: SelectChangeEvent) => customFieldDispatch(editTypeIdAction(e.target.value)),
            labelID = useRef(uuidv4()).current,
            ref = useRef<HTMLDivElement>()

        return (
            <FormControl fullWidth required>
                <InputLabel id={labelID}>Field Type</InputLabel>
                <Select
                    ref={ref}
                    labelId={labelID}
                    value={value}
                    disabled={disabled}
                    label='Field Type'
                    onChange={handleChange}
                    open={open}
                    onOpen={openTypeSelect}
                    onClose={closeTypeSelect}
                >
                    {options.map(({id,typeName})=>(
                        <MenuItem value={id} key={id}>{typeName}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        )
    }),
    DefaultValueComponentDivert = ({state}:{state:IcustomField})=>{
        const 
            {customFieldDispatch} = useContext(Context),
            textOnChange = (v:string)=>customFieldDispatch(editDefaultValueAction({key:state.fieldType,value:v}))

        if (state.fieldType==='short_text') return <ShortTextField {...{
            value:state.defaultValues[state.fieldType] || '',
            onChange:textOnChange
        }} />
        else if (state.fieldType==='number') return <NumberField {...{
            value:state.defaultValues[state.fieldType]?.toString() || '',
            onChange:textOnChange
        }} />
        else if (state.fieldType==='link') return <LinkField {...{
            fieldTypeID:state.fieldType,
            value:state.defaultValues[state.fieldType]
        }} />
        else if (state.fieldType==='checkbox') return <CheckboxField {...{
            checked:state.defaultValues[state.fieldType] || false,
            onChange:(v:boolean)=>customFieldDispatch(editDefaultValueAction({key:state.fieldType,value:v}))
        }} />
        else if (state.fieldType==='dropdown') return <DropdownField {...{
            fieldTypeID:state.fieldType,
            options:state.options[state.fieldType],
            defaultValue:state.defaultValues[state.fieldType]
        }} />
        else if (state.fieldType==='tags') return <TagsField {...{
            fieldTypeID:state.fieldType,
            options:state.options[state.fieldType],
            defaultValue:state.defaultValues[state.fieldType]
        }} />
        else if (state.fieldType==='date') return <DateField {...{
            fieldTypeID:state.fieldType,
            date:state.defaultValues[state.fieldType] ?? null
        }} />
        else if (state.fieldType==='single_person') return <SingleUserField {...{
            fieldTypeID:state.fieldType,
            value:state.defaultValues[state.fieldType]
        }} />
        else if (state.fieldType==='people') return <PeopleField {...{
            fieldTypeID:state.fieldType,
            value:state.defaultValues[state.fieldType]
        }} />
        else return <></>
    }

AddCustomFieldDialog.displayName = 'AddCustomFieldDialog'
EditCustomFieldDialog.displayName = 'EditCustomFieldDialog'
NameField.displayName = 'NameField'
TypeField.displayName = 'TypeField'
export { AddCustomFieldDialog, EditCustomFieldDialog, Context }