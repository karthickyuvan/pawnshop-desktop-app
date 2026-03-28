// import { invoke } from "@tauri-apps/api/core";

// export const createPledge = async (pledgeData) => {
//   return await invoke("create_pledge_cmd", { request: pledgeData });
// };



// export const getAllPledges = async (search, actorUserId) => {
//   return await invoke("get_all_pledges_cmd", {
//     search: search || null,
//     actorUserId,
//   });
// };

// export const getSinglePledge = async (pledgeId) => {
//   return await invoke("get_single_pledge_cmd", {
//     pledgeId: Number(pledgeId),
//   });
// };



import { invoke } from "@tauri-apps/api/core";

export const createPledge = async (pledgeData) => {
  // Step 1: Create the pledge (returns pledge_no as string)
  console.log("📤 Creating pledge with data:", pledgeData);
  const pledgeNo = await invoke("create_pledge_cmd", { request: pledgeData });
  console.log("✅ Pledge created, pledgeNo:", pledgeNo);

  
  // Step 2: Fetch all pledges to find the one we just created
  const allPledges = await invoke("get_all_pledges_cmd", {
    search: pledgeNo,
    actorUserId: pledgeData.created_by,
  });console.log("📋 All pledges response:", allPledges);
  
  // Step 3: Find the pledge we just created
  const createdPledge = allPledges.pledges.find(p => p.pledge_no === pledgeNo);
  console.log("🔍 Found created pledge:", createdPledge);
  
  if (!createdPledge) {
    // Fallback if we can't find it
    console.error("❌ Could not find created pledge in list");
    return {
      pledgeNo,
      pledgeId: null,
      receipt_number: "N/A"
    };
  }
  
  // Step 4: Get full pledge details including receipt_number
  const fullDetails = await invoke("get_single_pledge_cmd", {
    pledgeId: Number(createdPledge.id),
  });
  console.log("📄 Full pledge details:", fullDetails);
  console.log("🎫 Receipt number:", fullDetails.pledge.receipt_number);
  // Step 5: Return everything the frontend needs
  return {
    pledgeNo,
    pledgeId: createdPledge.id,
    receipt_number: fullDetails.pledge.receipt_number,
    fullDetails
  };
};

export const getAllPledges = async (search, actorUserId) => {
  return await invoke("get_all_pledges_cmd", {
    search: search || null,
    actorUserId,
  });
};

export const getSinglePledge = async (pledgeId) => {
  const result = await invoke("get_single_pledge_cmd", {
    pledgeId: Number(pledgeId),
  });
  console.log("📄 getSinglePledge result:", result);
  console.log("🎫 Receipt number from getSinglePledge:", result.pledge?.receipt_number);
  return result;
};