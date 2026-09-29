import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const BUCKET_NAME = "challenge-photos";

export async function DELETE() {
  const supabase = await createClient();

  // 로그인 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // 방장인 Room이 있는지 확인
  const { data: ownedRooms, error: ownedRoomsError } =
    await supabase
      .from("challenges")
      .select("id, name")
      .eq("owner_id", user.id);

  if (ownedRoomsError) {
    console.error(
      "ACCOUNT DELETE OWNED ROOM ERROR:",
      ownedRoomsError,
    );

    return NextResponse.json(
      { error: ownedRoomsError.message },
      { status: 500 },
    );
  }

  if (ownedRooms && ownedRooms.length > 0) {
    return NextResponse.json(
      {
        error:
          "You still own a room. Delete your rooms before deleting your account.",
      },
      { status: 400 },
    );
  }

  // 현재 사용자의 모든 membership
  const { data: memberships, error: membershipsError } =
    await supabase
      .from("members")
      .select("id, challenge_id")
      .eq("user_id", user.id);

  if (membershipsError) {
    console.error(
      "ACCOUNT DELETE MEMBERSHIPS ERROR:",
      membershipsError,
    );

    return NextResponse.json(
      { error: membershipsError.message },
      { status: 500 },
    );
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // 모든 Room에서 내 사진 삭제
  for (const membership of memberships ?? []) {
    const memberPath =
      `${membership.challenge_id}/${membership.id}`;

    const { data: files, error: listError } =
      await admin.storage
        .from(BUCKET_NAME)
        .list(memberPath, {
          limit: 1000,
        });

    if (listError) {
      console.error(
        "ACCOUNT DELETE STORAGE LIST ERROR:",
        listError,
      );

      return NextResponse.json(
        { error: listError.message },
        { status: 500 },
      );
    }

    const filePaths =
      files
        ?.filter((file) => file.name)
        .map(
          (file) =>
            `${memberPath}/${file.name}`,
        ) ?? [];

    if (filePaths.length > 0) {
      const { error: removeError } =
        await admin.storage
          .from(BUCKET_NAME)
          .remove(filePaths);

      if (removeError) {
        console.error(
          "ACCOUNT DELETE STORAGE ERROR:",
          removeError,
        );

        return NextResponse.json(
          { error: removeError.message },
          { status: 500 },
        );
      }
    }
  }

  // Auth 계정 삭제
  const { error: deleteUserError } =
    await admin.auth.admin.deleteUser(user.id);

  if (deleteUserError) {
    console.error(
      "ACCOUNT DELETE AUTH ERROR:",
      deleteUserError,
    );

    return NextResponse.json(
      { error: deleteUserError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}