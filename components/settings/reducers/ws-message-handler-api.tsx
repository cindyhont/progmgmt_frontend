import apiSlice from "@reducers/api";
import { updateUsername } from "@reducers/misc";
import { userDetailsUpdateOne } from "@reducers/user-details/slice";
import { IupdateAvatarPayload, IupdateUsernamePayload } from "./ws-message-types";

const settingsWsHandlerApi = apiSlice.injectEndpoints({
    endpoints:build=>({
        updateUsernameFromWS:build.mutation<any,IupdateUsernamePayload>({
            queryFn({username},{dispatch}){
                dispatch(updateUsername(username))
                return {data:null}
            },
        }),
        updateAvatarFromWS:build.mutation<any,IupdateAvatarPayload>({
            queryFn({avatar,user},{dispatch}){
                dispatch(userDetailsUpdateOne({id:user,changes:{avatar}}))
                return {data:null}
            }
        }),
    })
})

export default settingsWsHandlerApi