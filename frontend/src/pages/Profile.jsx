/* eslint-disable react-hooks/exhaustive-deps */
import axios from "axios"
import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import Footer from "../components/Footer"
import Navbar from "../components/Navbar"
import ProfileOrders from "../components/ProfileOrders"
import { UserContext } from "../context/UserContext"
import { URL } from "../url"


const Profile = () => {
  const param=useParams().id
  const [firstName,setfirstName]=useState("")
  const [lastName,setlastName]=useState("")
  const [email,setEmail]=useState("")
  const [password,setPassword]=useState("")
  const {user,setUser}=useContext(UserContext)
  const navigate=useNavigate()
  const [orders,setOrders]=useState([])
  const [updated,setUpdated]=useState(false)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  // console.log(user)

  const fetchProfile=async ()=>{
    try{
     const res=await axios.get(URL+"/userAPI/Customer/"+user._id)
     setfirstName(res.data.firstName)
     setlastName(res.data.lastName)
     setEmail(res.data.email)
     console.log(user);
     //setPassword(res.data.password)
    }
    catch(err){
     console.log(err)
    }
  }

  const handleUserUpdate=async ()=>{
    setUpdated(false)
    try{
      const res=await axios.put(URL+"/userAPI/Customer/"+user._id,{firstName, lastName,email,password},{withCredentials:true})
      console.log(res.data)
      setUpdated(true)
    }
    catch(err){
      console.log(err)
      setUpdated(false)
    }
  }

  const handleUserDelete=async()=>{
    try{
      const res=await axios.delete(URL+"/userAPI/Customer/"+user._id,{withCredentials:true})
      console.log(res);
      setUser(null)
      navigate("/")
      // console.log(res.data)
    }
    catch(err){
      console.log(err)
   }
  }
// console.log(user)
  const fetchUserOrders=async ()=>{
    try{
      const res=await axios.get("http://localhost:5000/userAPI/Customer/getOrders/"+user._id)
      console.log(res.data)
      setOrders(res.data)
    }
    catch(err){
      console.log(err)
    }
  }

  useEffect(()=>{
    fetchProfile()
  },[param])

  useEffect(()=>{
    fetchUserOrders()
  },[param])

  return (
    <div>
      <Navbar/>
      <div className="min-h-[80vh] px-8 md:px-[200px] mt-8 flex md:flex-row flex-col-reverse md:items-start items-start">
        <div className="flex flex-col md:w-[70%] w-full mt-8 md:mt-0">
        <h1 className="text-xl font-bold mb-4">Due Orders:</h1>
         {currentOrders.length === 0 ? (
            <p className="text-2xl font-bold text-times-new-roman">
               You do not have any Unpaid Orders
            </p>
          ):(<>
         {currentOrders.map((order) => (
          <ProfileOrders key={order._id} order={order} />
        ))}
        <div className="flex justify-center mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => paginate(i + 1)}
              className={`mx-1 px-3 py-1 bg-gray-200 hover:bg-gray-300 ${
                currentPage === i + 1 && 'bg-gray-400'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        </>
        )}
        </div>
        <div className="md:sticky md:top-12  flex justify-start md:justify-end items-start md:w-[30%] w-full md:items-end ">
        <div className=" flex flex-col space-y-4 items-start">
        <h1 className="text-xl font-bold mb-4">Profile</h1>
          <input onChange={(e)=>setfirstName(e.target.value)} value={firstName} className="outline-none px-4 py-2 text-gray-500" placeholder="Your firstName" type="text"/>
          <input onChange={(e)=>setlastName(e.target.value)} value={lastName} className="outline-none px-4 py-2 text-gray-500" placeholder="Your lastName" type="text"/>
          <input onChange={(e)=>setEmail(e.target.value)} value={email} className="outline-none px-4 py-2 text-gray-500" placeholder="Your email" type="email"/>
           <input onChange={(e)=>setPassword(e.target.value)} value={password} className="outline-none px-4 py-2 text-gray-500" placeholder="Your password" type="password"/>
          <div className="flex items-center space-x-4 mt-8">
            <button onClick={handleUserUpdate} className="text-white font-semibold bg-black px-4 py-2 hover:text-black hover:bg-gray-400">Update</button>
            <button onClick={handleUserDelete} className="text-white font-semibold bg-black px-4 py-2 hover:text-black hover:bg-gray-400">Delete</button>
          </div>
          {updated && <h3 className="text-green-500 text-sm text-center mt-4">user updated successfully!</h3>}
        </div>
          
        </div>
      </div>
      <Footer/>
    </div>
  )
}

export default Profile