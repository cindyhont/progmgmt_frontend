import React, { ChangeEvent, memo, useMemo } from 'react'
import { useTheme } from '@mui/material/styles';
import TableRow from '@mui/material/TableRow';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import { useAppDispatch, useAppSelector } from '@reducers';
import { useGetHrmStaffBackendIDsQuery } from './reducers/api';
import { shallowEqual } from 'react-redux'
import { backendStaffFilterSelector, updatePage, updateRowsPerPage } from './reducers/slice';
import AllCheckBox from './all-checkbox';
import { staffRowsPerPageOptions as rowsPerPageOptions } from '../functions'

const 
    Footer = memo(()=>{
        const theme = useTheme()
        return (
            <TableFooter
                sx={{
                    position:'sticky',
                    insetBlockEnd:'0',
                    backgroundColor:theme.palette.background.default,
                    zIndex:'1'
                }}
            >
                <TableRow>
                    <AllCheckBox />
                    <Pagination />
                </TableRow>
            </TableFooter>
        )
    }),
    Pagination = memo(()=>{
        const 
            dispatch = useAppDispatch(),
            backEndSelector = useMemo(()=>backendStaffFilterSelector(),[]),
            filters = useAppSelector(state => backEndSelector(state),shallowEqual),
            {totalCount} = useGetHrmStaffBackendIDsQuery(filters,{
                selectFromResult:({data}) => ({
                    totalCount:!!data ? data.length : 0
                })
            }),
            rowsPerPage = useAppSelector(state=>state.hrmStaff.limit,shallowEqual),
            page = useAppSelector(state=>state.hrmStaff.page,shallowEqual),
            handleChangePage = (_e:any,newPage:number) => dispatch(updatePage(newPage)),
            handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => dispatch(updateRowsPerPage(+e.target.value))

        return (
            <TablePagination 
                count={totalCount}
                rowsPerPageOptions={rowsPerPageOptions}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                    '.MuiTablePagination-spacer':{
                        flex:'0'
                    }
                }}
            />
        )
    })

Footer.displayName = 'Footer'
Pagination.displayName = 'Pagination'
export default Footer