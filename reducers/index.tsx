import { configureStore, combineReducers, ThunkDispatch, AnyAction, ThunkAction, EntityState, PreloadedState } from '@reduxjs/toolkit'
import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import startPageReducer, {Istart, sliceName as startPageSliceName} from '../components/start-page/reducer' 
import hrmDeptReducer, { IhrmDept, sliceName as hrmDeptSliceName } from '../components/hrm/dept/reducers/slice'
import hrmStaffReducer, { IhrmStaff, sliceName as hrmStaffSliceName } from '../components/hrm/staff/reducers/slice'
import chatReducer, { Ichat, sliceName as chatSliceName } from '@components/chat/reducers/slice'
import taskReducer, { Itask, sliceName as taskSliceName } from '@components/tasks/reducers/slice'
import miscReducer, { Imisc, sliceName as miscSliceName } from './misc'
import googleFilePrelimReducer, { GoogleFilePrelim, sliceName as googleFilePrelimSliceName } from './google-upload-api/slice'
import googleFileReducer, {GoogleFile, sliceName as googleFileSliceName} from './google-download-api/slice'
import apiSlice from './api'
import userDetailsReducer, { sliceName as userDetailsSliceName } from './user-details/slice'
import { UserDetails } from './user-details/interfaces'

export interface Istore{
    [startPageSliceName]:Istart;
    [hrmDeptSliceName]:IhrmDept;
    [hrmStaffSliceName]:IhrmStaff;
    [chatSliceName]:Ichat;
    [miscSliceName]:Imisc;
    [googleFilePrelimSliceName]:EntityState<GoogleFilePrelim>;
    [googleFileSliceName]:EntityState<GoogleFile>;
    [userDetailsSliceName]:EntityState<UserDetails>;
    [taskSliceName]:Itask;
}

export const rootReducer = combineReducers({
    [startPageSliceName]:startPageReducer,
    [hrmDeptSliceName]:hrmDeptReducer,
    [hrmStaffSliceName]:hrmStaffReducer,
    [chatSliceName]:chatReducer,
    [miscSliceName]:miscReducer,
    [googleFilePrelimSliceName]:googleFilePrelimReducer,
    [googleFileSliceName]:googleFileReducer,
    [userDetailsSliceName]:userDetailsReducer,
    [taskSliceName]:taskReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
})

export type ReduxState = ReturnType<typeof rootReducer>;

const configureAppStore = (preloadedState?:PreloadedState<ReduxState>) => configureStore({
    reducer:rootReducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
    ...(!!preloadedState && {preloadedState})
})

export default configureAppStore;

export type AppDispatch = ThunkDispatch<ReduxState, any, AnyAction>;
export type TypedThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  ReduxState,
  unknown,
  AnyAction
>;
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<ReduxState> = useSelector