import { ReduxState } from "@reducers";
import apiSlice, { fetchConfig } from "@reducers/api";
import { isSignedOut, sessionRenewTime, updateMaxChildTaskLvl, updateUsername } from "@reducers/misc";
import { userDetailsUpdateOne } from "@reducers/user-details/slice";
import websocketApi from "websocket/api";

const 
    PATH = '/api',
    settingsApi = apiSlice.injectEndpoints({
        endpoints:build=>({
            updateUsername:build.mutation<any,{
                username:string;
                password:string;
            }>({
                async queryFn(arg,{dispatch},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/settings/update-username`,'POST',arg))

                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }

                        const {success,wsid} = result.data as {success:boolean;wsid:string}
                        if (success) {
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                            dispatch(updateUsername(arg.username))
                        }
                        dispatch(sessionRenewTime(start))

                        return {data:success}
                    } catch {}
                    return {data:null}
                }
            }),
            udpateAvatar:build.mutation<any,string>({
                query:avatar => fetchConfig(`${PATH}/settings/update-avatar`,'POST',{avatar}),
                async onQueryStarted(_,{ dispatch, getState, queryFulfilled }){
                    const uid = (getState() as ReduxState).misc.uid
                    try {
                        const 
                            start = Date.now(),
                            {data} = await queryFulfilled,
                            {wsid,avatar,success} = data as {wsid:string;avatar:string;success:boolean}
                        if (success) {
                            dispatch(userDetailsUpdateOne({id:uid,changes:{avatar}}))
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        }
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            updateMaxChildTaskLvl:build.mutation<any,{
                maxChildTaskLvl:number;
                fromWS:boolean;
            }>({
                async queryFn({maxChildTaskLvl,fromWS},{dispatch},_,baseQuery){
                    dispatch(updateMaxChildTaskLvl(maxChildTaskLvl))
                    if (fromWS) return {data:null}

                    try {
                        const
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/settings/update-max-child-task-lvl`,'POST',{maxChildTaskLvl}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }

                        const {success,wsid} = result.data as {success:boolean;wsid:string}
                        if (success) dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    return {data:null}
                }
            })
        })
    })

export const {
    useUpdateUsernameMutation,
    useUdpateAvatarMutation,
    useUpdateMaxChildTaskLvlMutation,
} = settingsApi
export default settingsApi