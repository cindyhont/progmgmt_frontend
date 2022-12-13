import React, { memo, useContext, useMemo } from "react";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAppSelector } from "@reducers";
import { backendStaffFilterSelector } from "./reducers/slice";
import { useGetHrmStaffBackendIDsQuery, useHrmStaffDeselectAllMutation } from "./reducers/api";
import { useTheme } from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import { DialogEditContext, EditModeContext } from ".";

const StaffSpeedDial = memo(() => {
    const 
        theme = useTheme(),
        {editMode} = useContext(EditModeContext),
        {dialogEditDispatch} = useContext(DialogEditContext),
        filterOnClick = () => dialogEditDispatch({type:'filter',payload:true}),
        addStaffMember = () => dialogEditDispatch({type:'addDialog',payload:true}),
        backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
        filters = useAppSelector(state => backEndSelector(state)),
        {someOptionsSelected} = useGetHrmStaffBackendIDsQuery(filters,{
            selectFromResult:({currentData}) => ({
                someOptionsSelected: !!currentData && !!currentData.length && currentData.some(({selected})=>selected)
            })
        }),
        deleteOnClick = () => dialogEditDispatch({type:'deleteDialog',payload:true}),
        toggleShowHideModal = () => dialogEditDispatch({type:'showHideColumnModalOn',payload:true}),
        [deselectAll] = useHrmStaffDeselectAllMutation(),
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
                    display:someOptionsSelected ? 'flex' : 'none',
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
                onClick={addStaffMember}
            />
            <SpeedDialAction 
                icon={<FilterAltIcon />}
                tooltipOpen
                tooltipTitle='Filter'
                onClick={filterOnClick}
            />
            <SpeedDialAction 
                icon={<ViewWeekIcon />}
                tooltipOpen
                tooltipTitle='Column Visibility'
                onClick={toggleShowHideModal}
            />
            <SpeedDialAction 
                icon={editMode ? <VisibilityIcon /> : <EditIcon />}
                tooltipOpen
                tooltipTitle={editMode ? 'View only' : 'Edit Mode'}
                onClick={viewEditModeOnClick}
            />
        </SpeedDial>
    )
})
StaffSpeedDial.displayName = 'StaffSpeedDial'
export default StaffSpeedDial;