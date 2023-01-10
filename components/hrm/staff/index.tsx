import React, { createContext, Dispatch, memo, useReducer } from "react";
import Grid from '@mui/material/Grid';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import Head from "./header";
import Body from "./body";
import Footer from "./footer";
import StaffSpeedDial from "./speeddial";
import FilterModal from "./filter-modal";
import AddStaffDialog from "./add-staff-dialog";
import DeleteDialog from "./delete-dialog";
import ShowHideColumnModal from "./show-hide-columns-modal";
import { initialState, ItoggleFilterAction, reducer } from "./reducers/dialog-edit-status";

const 
    DialogEditContext = createContext<{dialogEditDispatch:Dispatch<ItoggleFilterAction>}>({dialogEditDispatch:()=>{}}),
    EditModeContext = createContext<{editMode:boolean}>({editMode:false}),
    Staff = memo(() => {
        const [state,dialogEditDispatch] = useReducer(reducer,initialState)
        return (
            <Grid
                item
                xs={12}
                sx={{margin:'auto'}}
            >
                <TableContainer
                    sx={{
                        maxHeight: 'calc(var(--viewport-height) - 180px)',
                        '& .MuiTableCell-head':{
                            py:0.3
                        },
                    }}
                >
                    <Table stickyHeader>
                        <EditModeContext.Provider value={{editMode:state.editMode}}>
                            <Head />
                            <Body />
                            <Footer />
                        </EditModeContext.Provider>
                    </Table>
                </TableContainer>
                <DialogEditContext.Provider value={{dialogEditDispatch}} >
                    <EditModeContext.Provider value={{editMode:state.editMode}}>
                        <StaffSpeedDial />
                    </EditModeContext.Provider>
                    <FilterModal filterOn={state.filter} />
                    <AddStaffDialog addDialogOn={state.addDialog} />
                    <DeleteDialog deleteDialogOn={state.deleteDialog} />
                </DialogEditContext.Provider>
                <ShowHideColumnModal showHideColumnModalOn={state.showHideColumnModalOn} />
            </Grid>
        )
    })

Staff.displayName = 'Staff'
export default Staff;
export {
    DialogEditContext,
    EditModeContext,
}