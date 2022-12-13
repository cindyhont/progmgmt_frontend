import React, { useContext, useMemo } from "react";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppSelector } from "@reducers";
import { backendDeptFilterSelector } from "./reducers/slice";
import { useTheme } from "@mui/material";
import { useGetHrmDeptBackendIDsQuery, useHrmDeptDeselectAllMutation } from "./reducers/api";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import { DialogEditContext, EditModeContext } from ".";


const DeptSpeedDial = () => {
    const 
        theme = useTheme(),
        {dialogEditDispatch} = useContext(DialogEditContext),
        filterOnClick = () => dialogEditDispatch({type:'filter',payload:true}),
        addDept = () => dialogEditDispatch({type:'addDialog',payload:true}),
        backendDeptSelector = useMemo(()=>backendDeptFilterSelector(),[]),
        filters = useAppSelector(state => backendDeptSelector(state)),
        {editMode} = useContext(EditModeContext),
        {selectedCount} = useGetHrmDeptBackendIDsQuery(filters,{
            selectFromResult:({currentData}) => ({
                selectedCount: currentData ? currentData.filter(({selected})=>selected).length : 0
            })
        }),
        deleteOnClick = () => dialogEditDispatch({type:'deleteDialog',payload:true}),
        [deselectAll] = useHrmDeptDeselectAllMutation(),
        viewEditModeOnClick = () => {
            if (editMode) deselectAll()
            dialogEditDispatch({type:'editMode',payload:!editMode})
        }

    return (
        <SpeedDial
            ariaLabel="SpeedDial tooltip"
            sx={{ position: 'fixed', bottom: 50, right: 50 }}
            icon={<SpeedDialIcon />}
        >
            <SpeedDialAction 
                icon={<DeleteIcon />}
                tooltipOpen
                tooltipTitle='Delete'
                sx={{
                    display:selectedCount===0 ? 'none' : 'flex',
                    '.MuiSpeedDialAction-staticTooltipLabel':{
                        backgroundColor:theme.palette.error.dark,
                        color:'#fff'
                    },
                    '.MuiButtonBase-root':{
                        backgroundColor:theme.palette.error.dark,
                    },
                    '.MuiButtonBase-root:hover':{
                        backgroundColor:theme.palette.error.light,
                    },
                    '& path':{
                        fill:'#fff'
                    }
                }}
                onClick={deleteOnClick}
            />
            <SpeedDialAction 
                icon={<AddIcon />}
                tooltipOpen
                tooltipTitle='Add'
                onClick={addDept}
            />
            <SpeedDialAction 
                icon={<FilterAltIcon />}
                tooltipOpen
                tooltipTitle='Filter'
                onClick={filterOnClick}
            />
            <SpeedDialAction 
                icon={editMode ? <VisibilityIcon /> : <EditIcon />}
                tooltipOpen
                tooltipTitle={editMode ? 'View only' : 'Edit Mode'}
                onClick={viewEditModeOnClick}
            />
        </SpeedDial>
    )
}

export default DeptSpeedDial;