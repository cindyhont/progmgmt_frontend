import React, { memo, useContext, useMemo } from "react";
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import { useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import { useDeleteHrmStaffActiveMutation, useGetHrmStaffBackendIDsQuery } from "./reducers/api";
import { backendStaffFilterSelector } from "./reducers/slice";
import { DialogEditContext } from ".";

const 
    DeleteDialog = memo(({deleteDialogOn}:{deleteDialogOn:boolean}) => {
        const
            {dialogEditDispatch} = useContext(DialogEditContext),
            backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
            filters = useAppSelector(state => backEndSelector(state),shallowEqual),
            {count} = useGetHrmStaffBackendIDsQuery(filters,{
                selectFromResult:({currentData}) => ({
                    count: currentData ? currentData.filter(({selected})=>selected).length : 0
                })
            }),
            closeDialog = () => dialogEditDispatch({type:'deleteDialog',payload:false})

        return (
            <Dialog
                open={deleteDialogOn}
                onClose={closeDialog}
            >
                <DialogTitle>
                    Delete {count === 1 ? 'this staff member' : `these ${count} staff members`}?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        The deleted items cannot be recovered.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button 
                        variant="outlined"
                        onClick={closeDialog} 
                        autoFocus
                    >Cancel</Button>
                    <DeleteButton />
                </DialogActions>
            </Dialog>
        )
    }),
    DeleteButton = memo(()=>{
        const
            {dialogEditDispatch} = useContext(DialogEditContext),
            [deleteItems] = useDeleteHrmStaffActiveMutation(),
            onClick = () => {
                deleteItems(undefined)
                dialogEditDispatch({type:'deleteDialog',payload:false})
            }

        return (
            <Button 
                color='error' 
                variant="contained"
                onClick={onClick}
            >Delete</Button>
        )
    })
    
DeleteButton.displayName = 'DeleteButton'
DeleteDialog.displayName = 'DeleteDialog'
export default DeleteDialog