import React, { ChangeEvent, memo, useContext, useEffect, useRef, useState } from "react";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { editTextFieldAction } from "./reducer";
import { useAppSelector } from "@reducers";
import { Context } from ".";
import { useSearchTasksMutation } from "@components/tasks/reducers/api";
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import IconButton from '@mui/material/IconButton'
import { DialogCtxMenuDispatchContext } from "@components/tasks/contexts";
import { toggleDialogAction } from "@components/tasks/reducers/dialog-ctxmenu-status";

export interface Ioption {
    value:string;
    label:string;
}

const ParentSelector = memo((
    {
        open,
        field,
    }:{
        open:boolean;
        field:'parent'
    }
)=>{
    const 
        {addEditTaskDispatch} = useContext(Context),
        noParent = useRef<Ioption>({value:'',label:'(No parent)'/*,parents:[]*/}).current,
        [value,setValue] = useState<Ioption>(null),
        [options,setOptions] = useState([noParent]),
        onChange = (
            e:ChangeEvent<HTMLInputElement>,
            v:Ioption|null
        ) => {
            e.preventDefault()
            if (!!v) addEditTaskDispatch(editTextFieldAction({key:field,value:v.value}))
            else addEditTaskDispatch(editTextFieldAction({key:field,value:''}))
            setValue(v)
        },
        [searchTasks] = useSearchTasksMutation(),
        onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
            if (['',noParent.label].includes(v.trim())) {
                setOptions([noParent])
                return
            }

            try {
                const response = await searchTasks({query:v,exclude:[]}).unwrap()
                setOptions([...response,noParent])
            } catch (error) {
                setOptions([noParent])
            }
        },
        isVisitor = useAppSelector(state => state.misc.visitor),
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        infoOnClick = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'visitorNoticeParentSearch',open:true}))

    useEffect(()=>{
        if (open) setValue(null)
    },[open])
        
    return (
        <Table
            sx={{
                '.MuiTableCell-root':{
                    p:0,
                    border:'none'
                }
            }}
        >
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Autocomplete 
                            disablePortal
                            fullWidth
                            value={value}
                            options={options}
                            onChange={onChange}
                            onInputChange={onInputChange}
                            filterSelectedOptions={false}
                            renderInput={(params) => <TextField {...params} label="Parent Task" />}
                        />
                    </TableCell>
                    {isVisitor && <TableCell sx={{width:0}}>
                        <IconButton onClick={infoOnClick}>
                            <InfoOutlinedIcon />
                        </IconButton>
                    </TableCell>}
                </TableRow>
            </TableBody>
        </Table>
    )
})
ParentSelector.displayName = 'ParentSelector'
export default ParentSelector