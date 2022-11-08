import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export enum TagTypes {
    Department_FRONTEND = 'Department_frontend',
    Department_BACKEND = 'Department_backend',
    Staff_FRONTEND = 'Staff_frontend',
    Staff_BACKEND = 'Staff_backend',
    Staff_SUPERVISOR = 'Staff_supervisor',
    Staff_DEPARTMENT = 'Staff_department',
    Chat_SEARCH_RESULT = 'Chat_searchResult',
    Chat_ROOM_ID_AND_LATEST_TIME = 'Chat_room_id_and_latest_time',
    CHAT_ROOM_CONTENT = 'Chat_room_content',
}

const 
    apiSlice = createApi({
        reducerPath:'apiSlice',
        baseQuery: fetchBaseQuery({ baseUrl: '' }),
        tagTypes:[
            TagTypes.Department_FRONTEND,
            TagTypes.Department_BACKEND,
            TagTypes.Staff_BACKEND,
            TagTypes.Staff_FRONTEND,
            TagTypes.Staff_SUPERVISOR,
            TagTypes.Staff_DEPARTMENT,
            TagTypes.Chat_SEARCH_RESULT,
            TagTypes.Chat_ROOM_ID_AND_LATEST_TIME,
            TagTypes.CHAT_ROOM_CONTENT,
        ],
        endpoints: () => ({}),
    }),
    fetchConfig = (url:string,method:'GET'|'POST'|'DELETE'|'PATCH'|'PUT',body?:any) => ({
        url,
        method,
        headers: { 
            'Content-Type': 'application/json',
            sMethod:'ck',
            credentials:'include',
        },
        ...(!!body && {body:JSON.stringify(body)})
    })

export { fetchConfig }
export default apiSlice;